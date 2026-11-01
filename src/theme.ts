// Appearance: <html data-theme> is "dark" or "light", or absent for Auto (style.css then follows the system). public/theme.js does the first paint.
import { native } from './native-midi'
import { settings } from './settings'

const GROUND = { dark: '#0c0e12', light: '#f3efe6' }

export function applyTheme() {
  const t = settings.theme
  if (t === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = t
  document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]').forEach((m) => (m.content = t === 'auto' ? m.dataset.auto! : GROUND[t]))
  if (native) void import('./native-app').then((m) => m.setAppearance(t)) // the window, so the web view, menus and keyboard match
}
