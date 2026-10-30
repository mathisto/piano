import Capacitor
import CoreAudioKit
import CoreMIDI
import UIKit

/// The web view the app runs in, with the CoreMIDI plugin registered.
class PianoViewController: CAPBridgeViewController {
    private let midi = CoreMidiPlugin()

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(midi)
    }

    /// A menu bar command (AppDelegate.buildMenu): the page acts on it as on its own key (src/native-app.ts).
    @objc func pageKey(_ sender: UIKeyCommand) {
        midi.notifyListeners("menu", data: ["key": sender.propertyList as? String ?? ""])
    }
}

/// WebKit has no Web MIDI. This forwards every connected MIDI source to the page, which fakes
/// navigator.requestMIDIAccess on top of it (src/native-midi.ts). Also: Apple's Bluetooth MIDI pairing sheet,
/// the screen kept awake while a run plays, a daily backup to Files, and files opened from other apps.
@objc(CoreMidiPlugin)
public class CoreMidiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CoreMidiPlugin"
    public let jsName = "CoreMidi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pairBluetooth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAwake", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "now", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveBackup", returnType: CAPPluginReturnPromise),
    ]

    private var client = MIDIClientRef()
    private var port = MIDIPortRef()
    private var timebase = mach_timebase_info_data_t()
    private var started = false
    private var connected = Set<Int32>() // unique ids of the sources we are connected to
    private var sources: [[String: Any]] = []

    /// A MIDI or MusicXML file opened from Files, Mail or AirDrop ("Open in Piano Forte"). Capacitor posts it, on a cold start
    /// once the plugins are loaded; the page may not be listening yet, so the event waits for it.
    override public func load() {
        NotificationCenter.default.addObserver(forName: .capacitorOpenURL, object: nil, queue: .main) { [weak self] note in
            guard let url = (note.object as? [String: Any])?["url"] as? URL, url.isFileURL else { return }
            let scoped = url.startAccessingSecurityScopedResource() // a file opened in place, still in its own app's folder
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { return }
            self?.notifyListeners("file", data: ["name": url.lastPathComponent, "data": data.base64EncodedString()], retainUntilConsumed: true)
        }
    }

    /// Host time in ms: CLOCK_UPTIME_RAW is mach time in nanoseconds, and not one of Apple's required-reason APIs.
    private static func uptime() -> Double { Double(clock_gettime_nsec_np(CLOCK_UPTIME_RAW)) / 1_000_000 }

    /// The clock the events are stamped on, for the page to find its offset from performance.now() (src/native-midi.ts).
    @objc func now(_ call: CAPPluginCall) {
        call.resolve(["t": Self.uptime()])
    }

    /// The page's whole record (Settings' export) into Documents, which Files shows as On My iPad > Piano Forte: one file a day,
    /// the last seven kept, so a record lost inside the web view cannot overwrite every good copy. Import reads one back.
    @objc func saveBackup(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else { return call.reject("No text") }
        do {
            let fm = FileManager.default
            let dir = try fm.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let day = ISO8601DateFormatter.string(from: Date(), timeZone: .current, formatOptions: [.withFullDate])
            try text.write(to: dir.appendingPathComponent("Piano Forte \(day).json"), atomically: true, encoding: .utf8)
            let old = try fm.contentsOfDirectory(atPath: dir.path).filter { $0.hasPrefix("Piano Forte ") && $0.hasSuffix(".json") }.sorted().dropLast(7)
            for name in old { try? fm.removeItem(at: dir.appendingPathComponent(name)) }
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        if !started {
            started = true
            mach_timebase_info(&timebase)
            MIDIClientCreateWithBlock("piano" as CFString, &client) { [weak self] _ in
                DispatchQueue.main.async { self?.refresh() } // a keyboard was plugged in or removed
            }
            MIDIInputPortCreateWithProtocol(client, "piano in" as CFString, ._1_0, &port) { [weak self] list, refCon in
                self?.receive(list, refCon)
            }
            refresh()
        }
        call.resolve(["sources": sources])
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

    /// Auto-lock off while a run plays or counts in (the page calls this on each phase change), on again otherwise.
    @objc func setAwake(_ call: CAPPluginCall) {
        let on = call.getBool("on") ?? false
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = on
            call.resolve()
        }
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
        DispatchQueue.main.async { self.notifyListeners("m", data: ["id": String(uid), "d": msgs]) }
    }
}
