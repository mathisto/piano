import AVFoundation
import Capacitor
import CoreMIDI
import UIKit

/// The web view the app runs in, with the CoreMIDI plugin registered.
class PianoViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CoreMidiPlugin())
    }
}

/// WebKit has no Web MIDI. This forwards every connected MIDI source to the page, which fakes
/// navigator.requestMIDIAccess on top of it (src/native-midi.ts).
@objc(CoreMidiPlugin)
public class CoreMidiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CoreMidiPlugin"
    public let jsName = "CoreMidi"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise)]

    private var client = MIDIClientRef()
    private var port = MIDIPortRef()
    private var timebase = mach_timebase_info_data_t()
    private var started = false
    private var connected = Set<Int32>() // unique ids of the sources we are connected to
    private var sources: [[String: Any]] = []

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

    /// Runs on CoreMIDI's thread. Pulls the MIDI 1.0 channel messages out of the UMP words and sends
    /// them with their age, so the page can stamp them at the moment the key went down.
    private func receive(_ list: UnsafePointer<MIDIEventList>, _ refCon: UnsafeMutableRawPointer?) {
        guard let refCon else { return }
        let uid = Int32(truncatingIfNeeded: Int(bitPattern: refCon) - 1)
        var msgs: [[Int]] = []
        var stamp: UInt64 = 0
        for packet in list.unsafeSequence() {
            if stamp == 0 { stamp = packet.pointee.timeStamp }
            var pkt = packet.pointee
            let count = Int(pkt.wordCount)
            withUnsafeBytes(of: &pkt.words) { raw in // the words arrive as a fixed-size tuple
                let words = raw.bindMemory(to: UInt32.self)
                for i in 0..<min(count, words.count) {
                    let word = words[i]
                    guard (word >> 28) & 0xF == 2 else { continue } // MIDI 1.0 channel voice
                    let status = Int((word >> 16) & 0xFF)
                    guard status >= 0x80 && status < 0xF0 else { continue }
                    msgs.append([status, Int((word >> 8) & 0x7F), Int(word & 0x7F)])
                }
            }
        }
        guard !msgs.isEmpty else { return }
        let tb = timebase
        DispatchQueue.main.async {
            let now = mach_absolute_time()
            let ticks = (stamp == 0 || stamp > now) ? 0 : now - stamp
            let ageMs = Double(ticks) * Double(tb.numer) / Double(tb.denom) / 1_000_000
            self.notifyListeners("m", data: ["id": String(uid), "d": msgs, "age": ageMs])
        }
    }
}
