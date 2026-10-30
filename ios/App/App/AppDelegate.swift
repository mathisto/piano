import AVFoundation
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Web Audio is muted by the silent switch unless the app asks for playback. The screen stays on only while a run
        // plays: the page calls CoreMidiPlugin.setAwake (PianoNative.swift).
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        return true
    }

    /// The menu bar (and the list a held ⌘ shows). The page's own shortcuts are single keys (Space, Escape, B ...), which a menu
    /// cannot take without taking them from its text fields and dialogs too, so these are ⌘ forms that hand the page the same key.
    override func buildMenu(with builder: UIMenuBuilder) {
        super.buildMenu(with: builder)
        guard builder.system == .main else { return }
        let key = { (title: String, input: String, mods: UIKeyModifierFlags, page: String) in
            UIKeyCommand(title: title, action: #selector(PianoViewController.pageKey(_:)), input: input, modifierFlags: mods, propertyList: page)
        }
        builder.insertChild(UIMenu(options: .displayInline, children: [key("Settings…", ",", .command, "settings")]), atEndOfMenu: .application)
        let tabs = ["Today", "Songs", "Read", "Scales", "Theory", "Technique", "Progress"]
        let go = UIMenu(title: "Go", children: tabs.enumerated().map { i, t in key(t, "\(i + 1)", .command, "tab:" + t.lowercased()) })
        let practice = UIMenu(title: "Practice", children: [
            key("Play or Pause", "\r", .command, " "),
            key("Metronome", "b", .command, "b"),
            key("Slower", "[", .command, "["),
            key("Faster", "]", .command, "]"),
        ])
        builder.insertSibling(go, afterMenu: .view)
        builder.insertSibling(practice, afterMenu: go.identifier)
        builder.insertChild(UIMenu(options: .displayInline, children: [
            key("Zoom In", "=", .command, "="),
            key("Zoom Out", "-", .command, "-"),
            key("Next View", "v", [.command, .alternate], "v"),
            key("Note Names", "n", [.command, .alternate], "n"),
        ]), atStartOfMenu: .view)
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
