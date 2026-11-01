// Runs before first paint (index.html): Auto needs nothing, the CSS follows the system; a forced Dark or Light is set here. src/theme.ts does the same later, and on a change.
try {
  var t = JSON.parse(localStorage.getItem('piano.settings')).theme
  if (t === 'dark' || t === 'light') {
    document.documentElement.dataset.theme = t
    document.querySelectorAll('meta[name=theme-color]').forEach(function (m) { m.content = t === 'dark' ? '#0c0e12' : '#f3efe6' })
  }
} catch (e) {}
