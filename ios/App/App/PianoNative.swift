import AVFoundation
import Capacitor
import CoreAudioKit
import CoreMIDI
import UIKit

/// The web view the app runs in, with the CoreMIDI plugin registered.
class PianoViewController: CAPBridgeViewController {
    private let midi = CoreMidiPlugin()

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(midi)
        // The web view's own background, until the page paints: stone in Matinée, ink in Nocturne (the "Ground" colour asset), so neither mode flashes the other
        let ground = UIColor(named: "Ground")
        webView?.backgroundColor = ground
        webView?.scrollView.backgroundColor = ground
    }

    /// A menu bar command (AppDelegate.buildMenu): the page acts on it as on its own key (src/native-app.ts).
    @objc func pageKey(_ sender: UIKeyCommand) {
        midi.notifyListeners("menu", data: ["key": sender.propertyList as? String ?? ""])
    }

    // While a run plays a swipe at an edge first shows the home indicator (faded by SystemBars, src/native-app.ts) instead of
    // leaving: a sleeve or a reach past the stand does not end the run, a second swipe still does. Menus keep the system's edges.
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { midi.playing ? .all : [] }
}

/// WebKit has no Web MIDI. This forwards every connected MIDI source to the page, which fakes
/// navigator.requestMIDIAccess on top of it (src/native-midi.ts). Also: Apple's Bluetooth MIDI pairing sheet,
/// the screen kept awake while a run plays or the keys are played, a run paused when the sound is taken, a daily backup to
/// Files, the system text size, and files opened from other apps.
@objc(CoreMidiPlugin)
public class CoreMidiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CoreMidiPlugin"
    public let jsName = "CoreMidi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pairBluetooth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAppearance", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "now", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveBackup", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncRead", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncWrite", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "textSize", returnType: CAPPluginReturnPromise),
    ]

    private var client = MIDIClientRef()
    private var port = MIDIPortRef()
    private var timebase = mach_timebase_info_data_t()
    private var started = false
    private var connected = Set<Int32>() // unique ids of the sources we are connected to
    private var sources: [[String: Any]] = []
    private(set) var playing = false // a run counts in, plays or waits (setPlaying)
    private var lastKey = -Double.infinity // uptime ms of the last message from a keyboard
    private var syncQuery: NSMetadataQuery?
    private var syncObserver: NSObjectProtocol?

    private func deliverShortcut() {
        guard let action = PianoShortcutRouter.takePending() else { return }
        notifyListeners("shortcut", data: ["action": action.rawValue], retainUntilConsumed: true)
    }

    /// A MIDI, MusicXML or pack (.pthpack, Info.plist) file opened from Files, Mail, Messages or AirDrop ("Open in Page to Hand"). Capacitor
    /// posts it, on a cold start once the plugins are loaded; the page may not be listening yet, so the event waits for it. The event:
    /// `file` with { name: the file's name with its extension, data: its bytes in base64 } (src/native-app.ts makes a File of it).
    override public func load() {
        NotificationCenter.default.addObserver(forName: .pianoShortcut, object: nil, queue: .main) { [weak self] _ in
            self?.deliverShortcut()
        }
        deliverShortcut() // an intent can run before Capacitor has loaded its plugin on a cold launch
        NotificationCenter.default.addObserver(forName: .capacitorOpenURL, object: nil, queue: .main) { [weak self] note in
            guard let url = (note.object as? [String: Any])?["url"] as? URL, url.isFileURL else { return }
            let scoped = url.startAccessingSecurityScopedResource() // a file opened in place, still in its own app's folder
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { return }
            self?.notifyListeners("file", data: ["name": url.lastPathComponent, "data": data.base64EncodedString()], retainUntilConsumed: true)
        }
        // A shared pack link: Associated Domains admits only this fragment, and the page validates both the URL and the pack again.
        NotificationCenter.default.addObserver(forName: .capacitorOpenUniversalLink, object: nil, queue: .main) { [weak self] note in
            guard let url = (note.object as? [String: Any])?["url"] as? URL,
                  url.scheme == "https", url.host == "app.pagetohand.com", url.path == "/",
                  url.fragment?.hasPrefix("pack=") == true else { return }
            self?.notifyListeners("link", data: ["url": url.absoluteString], retainUntilConsumed: true)
        }
        // the system text size changed (Settings, Control Center): the page rescales its type (textSize below)
        NotificationCenter.default.addObserver(forName: UIContentSizeCategory.didChangeNotification, object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("textSize", data: ["category": UIApplication.shared.preferredContentSizeCategory.rawValue])
        }
        // A call, Siri or an alarm takes the sound, or the headphones come out (Apple: playback pauses at once): the page pauses
        // a run and stops Listen back. Not on return from the background, which iOS reports as an interruption too: the run paused on leaving.
        let center = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()
        center.addObserver(forName: AVAudioSession.interruptionNotification, object: session, queue: .main) { [weak self] note in
            let info = note.userInfo ?? [:]
            guard (info[AVAudioSessionInterruptionTypeKey] as? UInt) == AVAudioSession.InterruptionType.began.rawValue else {
                try? session.setActive(true) // over: Web Audio's next sound resumes its context (src/audio.ts)
                return
            }
            if (info[AVAudioSessionInterruptionReasonKey] as? UInt) != AVAudioSession.InterruptionReason.appWasSuspended.rawValue {
                self?.notifyListeners("interrupt", data: nil)
            }
        }
        center.addObserver(forName: AVAudioSession.routeChangeNotification, object: session, queue: .main) { [weak self] note in
            if (note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt) == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue {
                self?.notifyListeners("interrupt", data: nil)
            }
        }
    }

    /// Host time in ms: CLOCK_UPTIME_RAW is mach time in nanoseconds, and not one of Apple's required-reason APIs.
    private static func uptime() -> Double { Double(clock_gettime_nsec_np(CLOCK_UPTIME_RAW)) / 1_000_000 }

    /// The clock the events are stamped on, for the page to find its offset from performance.now() (src/native-midi.ts).
    @objc func now(_ call: CAPPluginCall) {
        call.resolve(["t": Self.uptime()])
    }

    /// The system text size as its content size category (Dynamic Type): the page turns it into a root font scale, once here and on each
    /// "textSize" event (src/native-app.ts).
    @objc func textSize(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(["category": UIApplication.shared.preferredContentSizeCategory.rawValue]) }
    }

    /// The page's whole record (Settings' export) into Documents, which Files shows as On My iPad > Page to Hand: one file a day,
    /// the last seven kept, so a record lost inside the web view cannot overwrite every good copy. Import reads one back.
    @objc func saveBackup(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else { return call.reject("No text") }
        do {
            let fm = FileManager.default
            let dir = try fm.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let day = ISO8601DateFormatter.string(from: Date(), timeZone: .current, formatOptions: [.withFullDate])
            try text.write(to: dir.appendingPathComponent("Page to Hand \(day).json"), atomically: true, encoding: .utf8)
            let recovery = try fm.contentsOfDirectory(atPath: dir.path).filter {
                ($0.hasPrefix("Page to Hand ") || $0.hasPrefix("Piano Forte ")) && $0.hasSuffix(".json")
            }
            let old = recovery.sorted {
                let left = String($0.suffix(15)), right = String($1.suffix(15))
                return left == right ? $0.hasPrefix("Piano Forte ") : left < right
            }.dropLast(7)
            for name in old { try? fm.removeItem(at: dir.appendingPathComponent(name)) }
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    /// The app's Documents container appears in Files as iCloud Drive > Page to Hand. URL lookup can block while iCloud starts, so none of it runs on the main thread.
    private static func iCloudDocuments() throws -> URL {
        guard FileManager.default.ubiquityIdentityToken != nil,
              let root = FileManager.default.url(forUbiquityContainerIdentifier: "iCloud.io.mattkelly.piano") else {
            throw NSError(domain: "PageToHand", code: 1, userInfo: [NSLocalizedDescriptionKey: "iCloud Drive is not available. Turn it on in iPad Settings, then try again."])
        }
        let documents = root.appendingPathComponent("Documents", isDirectory: true)
        try FileManager.default.createDirectory(at: documents, withIntermediateDirectories: true, attributes: nil)
        return documents
    }

    @objc func syncAvailable(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .utility).async {
            call.resolve(["available": (try? Self.iCloudDocuments()) != nil])
        }
    }

    /// Metadata search sees files that exist on another device but are still placeholders here. Each is explicitly downloaded before its coordinated read.
    @objc func syncRead(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .utility).async {
            do { _ = try Self.iCloudDocuments() } catch { return call.reject(error.localizedDescription) }
            DispatchQueue.main.async { self.startSyncQuery(call) }
        }
    }

    private func startSyncQuery(_ call: CAPPluginCall) {
        if syncQuery != nil { return call.reject("A sync is already running.") }
        let query = NSMetadataQuery()
        query.searchScopes = [NSMetadataQueryUbiquitousDocumentsScope]
        query.predicate = NSPredicate(
            format: "(%K BEGINSWITH %@ OR %K BEGINSWITH %@) AND %K ENDSWITH %@",
            NSMetadataItemFSNameKey, "Page to Hand Sync ", NSMetadataItemFSNameKey, "Piano Forte Sync ", NSMetadataItemFSNameKey, ".json"
        )
        syncQuery = query
        syncObserver = NotificationCenter.default.addObserver(forName: .NSMetadataQueryDidFinishGathering, object: query, queue: .main) { [weak self, weak query] _ in
            guard let self, let query else { return }
            self.finishSyncQuery(query, call)
        }
        guard query.start() else {
            clearSyncQuery(query)
            return call.reject("iCloud Drive could not be read. Try again.")
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self, weak query] in
            guard let self, let query, self.syncQuery === query else { return }
            self.finishSyncQuery(query, call)
        }
    }

    private func clearSyncQuery(_ query: NSMetadataQuery) {
        query.stop()
        if let observer = syncObserver { NotificationCenter.default.removeObserver(observer) }
        syncObserver = nil
        syncQuery = nil
    }

    private func finishSyncQuery(_ query: NSMetadataQuery, _ call: CAPPluginCall) {
        guard syncQuery === query else { return }
        query.disableUpdates()
        let urls = query.results.compactMap { ($0 as? NSMetadataItem)?.value(forAttribute: NSMetadataItemURLKey) as? URL }
        clearSyncQuery(query)
        DispatchQueue.global(qos: .utility).async {
            let fm = FileManager.default
            let coordinator = NSFileCoordinator()
            var files: [[String: String]] = []
            for url in urls {
                try? fm.startDownloadingUbiquitousItem(at: url)
                for _ in 0..<40 {
                    let status = try? url.resourceValues(forKeys: [.ubiquitousItemDownloadingStatusKey]).ubiquitousItemDownloadingStatus
                    if status == .current || status == nil { break }
                    Thread.sleep(forTimeInterval: 0.25)
                }
                var coordinationError: NSError?
                var text: String?
                coordinator.coordinate(readingItemAt: url, options: [], error: &coordinationError) { coordinated in
                    text = try? String(contentsOf: coordinated, encoding: .utf8)
                }
                if let text { files.append(["name": url.lastPathComponent, "text": text]) }
            }
            call.resolve(["files": files])
        }
    }

    @objc func syncWrite(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), let text = call.getString("text"),
              name.hasPrefix("Page to Hand Sync "), name.hasSuffix(".json"), !name.contains("/") else {
            return call.reject("Invalid sync file.")
        }
        DispatchQueue.global(qos: .utility).async {
            do {
                let url = try Self.iCloudDocuments().appendingPathComponent(name)
                let coordinator = NSFileCoordinator()
                var coordinationError: NSError?
                var writeError: Error?
                coordinator.coordinate(writingItemAt: url, options: .forReplacing, error: &coordinationError) { coordinated in
                    do { try text.write(to: coordinated, atomically: true, encoding: .utf8) } catch { writeError = error }
                }
                if let coordinationError { throw coordinationError }
                if let writeError { throw writeError }
                call.resolve()
            } catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        // on the main thread: CoreMIDI reports a keyboard turned on or paired later on the thread that made the client, and only
        // if that thread has a run loop, which Capacitor's plugin queue has not (the FP-10 paired while the app ran was never seen)
        DispatchQueue.main.async {
            if !self.started {
                self.started = true
                mach_timebase_info(&self.timebase)
                MIDIClientCreateWithBlock("piano" as CFString, &self.client) { [weak self] _ in
                    DispatchQueue.main.async { self?.refresh() } // a keyboard was plugged in or removed
                }
                MIDIInputPortCreateWithProtocol(self.client, "piano in" as CFString, ._1_0, &self.port) { [weak self] list, refCon in
                    self?.receive(list, refCon)
                }
                // and on coming back to the app: a keyboard paired in Settings meanwhile, should a notification go missing
                NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in self?.refresh() }
                Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in self?.stayAwake() } // a key's two minutes running out
            }
            self.refresh()
            call.resolve(["sources": self.sources])
        }
    }

    /// Apple's sheet that finds Bluetooth MIDI keyboards and pairs one on a tap. A paired keyboard shows up as a
    /// CoreMIDI source, so refresh() reports it; since iOS 16 it reconnects by itself next time.
    @objc func pairBluetooth(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let host = self.bridge?.viewController else { return call.reject("No view to present from") }
            let central = CABTMIDICentralViewController()
            if #available(iOS 27, *) {
                // iOS 27.0 and 27.0.1 crash in its loadView (CALayerInvalidGeometry, a NaN table height). Apple DTS's workaround;
                // without the viewDidLoad() call it stops crashing but never scans. https://developer.apple.com/forums/thread/850584
                central.tableView = UITableView(frame: .zero, style: .grouped)
                central.viewDidLoad()
            }
            central.navigationItem.rightBarButtonItem = UIBarButtonItem(systemItem: .done, primaryAction: UIAction { [weak host] _ in host?.dismiss(animated: true) })
            let sheet = UINavigationController(rootViewController: central)
            sheet.modalPresentationStyle = .formSheet // centred on the iPad, over the dimmed app
            host.present(sheet, animated: true)
            call.resolve()
        }
    }

    /// The Appearance setting (Auto, Dark or Light): the window takes it, so the web view's background, menus and keyboard match the page,
    /// and the next launch starts in it (SceneDelegate). The launch screen itself can only follow the system.
    @objc func setAppearance(_ call: CAPPluginCall) {
        let theme = call.getString("theme") ?? "auto"
        UserDefaults.standard.set(theme, forKey: "appearance")
        DispatchQueue.main.async {
            self.bridge?.viewController?.view.window?.overrideUserInterfaceStyle = SceneDelegate.style(theme)
            call.resolve()
        }
    }

    /// A run plays, counts in or waits, or not (the page calls this on each phase change): auto-lock and the screen edges follow
    /// (PianoViewController).
    @objc func setPlaying(_ call: CAPPluginCall) {
        let on = call.getBool("on") ?? false
        DispatchQueue.main.async {
            self.playing = on
            self.stayAwake()
            self.bridge?.viewController?.setNeedsUpdateOfScreenEdgesDeferringSystemGestures()
            call.resolve()
        }
    }

    /// The idle timer counts touches, and a piano is played without one: auto-lock waits while a run plays and for two minutes
    /// after the last key, then the system's own Auto-Lock counts from there. Theory, the drills and the start card stay lit
    /// while the keys are played; a keyboard left on in an empty room does not keep the screen on.
    // ponytail: two minutes is a guess at "still at the piano"; tune it on the iPad if the screen dims between pieces.
    private func stayAwake() {
        let on = playing || Self.uptime() - lastKey < 120_000
        if UIApplication.shared.isIdleTimerDisabled != on { UIApplication.shared.isIdleTimerDisabled = on }
    }

    /// Connect to every source CoreMIDI lists (it delivers nothing from an unconnected one) and tell the page.
    private func refresh() {
        var list: [[String: Any]] = []
        var live = Set<Int32>()
        for i in 0..<MIDIGetNumberOfSources() {
            let src = MIDIGetSource(i)
            var uid: Int32 = 0
            MIDIObjectGetIntegerProperty(src, kMIDIPropertyUniqueID, &uid)
            var name: Unmanaged<CFString>?
            MIDIObjectGetStringProperty(src, kMIDIPropertyDisplayName, &name)
            let label = (name?.takeRetainedValue() as String?) ?? "MIDI input"
            if label.hasPrefix("Network Session") { continue } // Apple's built-in network MIDI, not a keyboard
            live.insert(uid)
            if !connected.contains(uid) {
                // the +1 keeps a unique id of 0 from becoming a null refCon
                MIDIPortConnectSource(port, src, UnsafeMutableRawPointer(bitPattern: Int(UInt32(bitPattern: uid)) + 1))
                connected.insert(uid)
            }
            list.append(["id": String(uid), "name": label])
        }
        connected.formIntersection(live) // a replugged keyboard connects again
        sources = list
        notifyListeners("sources", data: ["sources": list])
    }

    /// Runs on CoreMIDI's thread. Pulls the MIDI 1.0 channel messages out of the UMP words and sends each with
    /// its packet's host time in ms (0 is "now"), so the page stamps it when the key went down, not when it arrived.
    private func receive(_ list: UnsafePointer<MIDIEventList>, _ refCon: UnsafeMutableRawPointer?) {
        guard let refCon else { return }
        let uid = Int32(truncatingIfNeeded: Int(bitPattern: refCon) - 1)
        let tb = timebase
        var msgs: [[Double]] = []
        for packet in list.unsafeSequence() {
            let stamp = packet.pointee.timeStamp
            let t = stamp == 0 ? Self.uptime() : Double(stamp) * Double(tb.numer) / Double(tb.denom) / 1_000_000
            var pkt = packet.pointee
            let count = Int(pkt.wordCount)
            withUnsafeBytes(of: &pkt.words) { raw in // the words arrive as a fixed-size tuple
                let words = raw.bindMemory(to: UInt32.self)
                for i in 0..<min(count, words.count) {
                    let word = words[i]
                    guard (word >> 28) & 0xF == 2 else { continue } // MIDI 1.0 channel voice
                    let status = Int((word >> 16) & 0xFF)
                    guard status >= 0x80 && status < 0xF0 else { continue }
                    msgs.append([t, Double(status), Double((word >> 8) & 0x7F), Double(word & 0x7F)])
                }
            }
        }
        guard !msgs.isEmpty else { return }
        DispatchQueue.main.async {
            self.lastKey = Self.uptime()
            self.stayAwake()
            self.notifyListeners("m", data: ["id": String(uid), "d": msgs])
        }
    }
}
