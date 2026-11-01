import AVFoundation
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Web Audio is muted by silent mode unless the app asks for playback: a piano you play is sound you asked for. It mixes,
        // so music from another app plays on under it. When the screen stays on: CoreMidiPlugin.stayAwake (PianoNative.swift).
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        return true
    }

    /// The menu bar (and the list a held ⌘ shows). A command hands the page the key it already handles (src/app/input.ts, which
    /// src/menu.test.ts checks this list against), as a ⌘ form because a bare key cannot be a menu shortcut without being taken from
    /// text fields and dialogs. The same keys work as they are on the web. HIG: the tabs are View items, and the app's own settings
    /// sit beneath the system's "Piano Forte Settings…" (⌘, , checked in the simulator: it opens the app's page in iPadOS Settings).
    override func buildMenu(with builder: UIMenuBuilder) {
        super.buildMenu(with: builder)
        guard builder.system == .main else { return }
        let key = { (title: String, input: String, mods: UIKeyModifierFlags, page: String) in
            UIKeyCommand(title: title, action: #selector(PianoViewController.pageKey(_:)), input: input, modifierFlags: mods, propertyList: page)
        }
        let settings = key("In-App Settings…", ",", [.command, .alternate], ",")
        if let system = builder.menu(for: .preferences) {
            builder.replace(menu: .preferences, with: system.replacingChildren(system.children + [settings]))
        } else {
            builder.insertChild(UIMenu(options: .displayInline, children: [settings]), atEndOfMenu: .application)
        }
        let tabs = ["Today", "Songs", "Read", "Scales", "Theory", "Technique", "Progress"]
        let practice = UIMenu(title: "Practice", children: [
            key("Play or Pause", "\r", .command, " "),
            key("Metronome", "b", .command, "b"),
            key("Slower", "[", .command, "["),
            key("Faster", "]", .command, "]"),
        ])
        builder.insertSibling(practice, afterMenu: .view)
        builder.insertChild(UIMenu(options: .displayInline, children: [
            key("Zoom In", "=", .command, "="),
            key("Zoom Out", "-", .command, "-"),
            key("Next View", "v", [.command, .alternate], "v"),
            key("Note Names", "n", [.command, .alternate], "n"),
            key("Hide or Show Controls", "m", [.command, .alternate], "m"),
        ]), atStartOfMenu: .view)
        builder.insertChild(UIMenu(options: .displayInline, children: tabs.enumerated().map { i, t in key(t, "\(i + 1)", .command, "\(i + 1)") }), atStartOfMenu: .view)
        builder.insertChild(UIMenu(options: .displayInline, children: [key("Keyboard Shortcuts", "?", .command, "?")]), atStartOfMenu: .help)
    }

    /// The one window, built in code by SceneDelegate (there is no main storyboard).
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
