import type { CapacitorConfig } from '@capacitor/cli'

// The iPad app is the web build in a WKWebView. WebKit has no Web MIDI, so the keyboard comes in through
// the local CoreMidi plugin (ios/App/App/CoreMidiPlugin.swift) and src/native-midi.ts.
const config: CapacitorConfig = {
  appId: 'io.mattkelly.piano',
  appName: 'piano',
  webDir: 'dist',
  ios: { contentInset: 'never', backgroundColor: '#090b17', scrollEnabled: false },
}

export default config
