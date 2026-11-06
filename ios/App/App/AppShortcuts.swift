import AppIntents
import Foundation

enum PianoShortcutAction: String {
    case practice
    case sightRun = "sight-run"
}

extension Notification.Name {
    static let pianoShortcut = Notification.Name("PianoShortcut")
}

/// One pending action bridges an App Intent into the Capacitor page. UserDefaults covers a cold launch;
/// the notification covers an app that is already open. The page still owns every practice decision.
enum PianoShortcutRouter {
    private static let pendingKey = "PianoShortcutPending"

    @MainActor static func send(_ action: PianoShortcutAction) {
        UserDefaults.standard.set(action.rawValue, forKey: pendingKey)
        NotificationCenter.default.post(name: .pianoShortcut, object: nil)
    }

    static func takePending() -> PianoShortcutAction? {
        let defaults = UserDefaults.standard
        guard let raw = defaults.string(forKey: pendingKey), let action = PianoShortcutAction(rawValue: raw) else { return nil }
        defaults.removeObject(forKey: pendingKey)
        return action
    }
}

@available(iOS 16.0, *)
struct StartTodaysPracticeIntent: AppIntent {
    static let title: LocalizedStringResource = "Start Today's Practice"
    static let description = IntentDescription("Open the next item in today's Piano Forte practice plan.")
    static let openAppWhenRun = true

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { .foreground(.immediate) }

    @MainActor func perform() async throws -> some IntentResult {
        PianoShortcutRouter.send(.practice)
        return .result()
    }
}

@available(iOS 16.0, *)
struct OpenSightRunIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Sight Run"
    static let description = IntentDescription("Open the Piano Forte Sight Run builder.")
    static let openAppWhenRun = true

    @available(iOS 26.0, *)
    static var supportedModes: IntentModes { .foreground(.immediate) }

    @MainActor func perform() async throws -> some IntentResult {
        PianoShortcutRouter.send(.sightRun)
        return .result()
    }
}

@available(iOS 16.0, *)
struct PianoForteShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartTodaysPracticeIntent(),
            phrases: [
                "Start today's practice in \(.applicationName)",
                "Practice with \(.applicationName)",
            ],
            shortTitle: "Today's Practice",
            systemImageName: "music.note"
        )
        AppShortcut(
            intent: OpenSightRunIntent(),
            phrases: [
                "Open Sight Run in \(.applicationName)",
                "Sight-read with \(.applicationName)",
            ],
            shortTitle: "Sight Run",
            systemImageName: "music.quarternote.3"
        )
    }

    static let shortcutTileColor: ShortcutTileColor = .navy
}
