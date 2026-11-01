import type { CapacitorConfig } from '@capacitor/cli'

// The iPad app is the web build in a WKWebView. WebKit has no Web MIDI, so the keyboard comes in through
// the local CoreMidi plugin (ios/App/App/PianoNative.swift) and src/native-midi.ts.
const config: CapacitorConfig = {
  appId: 'io.mattkelly.piano',
  appName: 'Piano Forte',
  webDir: 'dist',
  // allowsLinkPreview: a long press on a link (Credits, Report a problem) shows no web page preview.
  // No backgroundColor: it is one colour for both modes. PianoViewController sets the web view's from the "Ground" colour asset (dark and light), as the launch storyboard does.
  ios: { contentInset: 'never', scrollEnabled: false, allowsLinkPreview: false },
}

export default config
