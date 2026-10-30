// Icons: Lucide (ISC, https://lucide.dev, path data copied in so nothing is fetched or bundled beyond these), the 24px grid, 2px
// round stroke; play and pause are filled, as Apple's play.fill is. One family: no icon drawn here by hand.
const P: Record<string, [string, boolean]> = {
  play: ['<path d="M7 4.5v15l12-7.5z"/>', true],
  pause: ['<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>', true],
  restart: ['<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>', false], // lucide rotate-ccw
  sliders: ['<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>', false], // lucide sliders-horizontal
  loop: ['<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>', false], // lucide repeat
  plus: ['<path d="M5 12h14"/><path d="M12 5v14"/>', false], // lucide plus
  minus: ['<path d="M5 12h14"/>', false], // lucide minus
  x: ['<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', false], // lucide x
  back: ['<path d="m15 18-6-6 6-6"/>', false], // lucide chevron-left
  check: ['<path d="M20 6 9 17l-5-5"/>', false], // lucide check
  page: ['<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>', false], // lucide scan
  more: ['<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>', false], // lucide ellipsis
  today: ['<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/>', false], // lucide calendar-check
  songs: ['<path d="M16 5H3"/><path d="M11 12H3"/><path d="M11 19H3"/><path d="M21 16V5"/><circle cx="18" cy="16" r="3"/>', false], // lucide list-music
  read: ['<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>', false], // lucide book-open
  scales: ['<path d="M10 13v4"/><path d="M14 13v4"/><path d="M18 13v4"/><path d="M2 13h20"/><path d="M22 11.5A3.5 3.5 0 0018.5 8a3.52 3.52 0 01-3.173-2A7 7 0 002 9v10a2 2 0 002 2h16a2 2 0 002-2z"/><path d="M6 13v4"/>', false], // lucide piano
  theory: ['<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>', false], // lucide graduation-cap
  technique: ['<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>', false], // lucide hand
  progress: ['<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>', false], // lucide chart-line
  metronome: ['<path d="M12 11.4V9.1"/><path d="m12 17 6.59-6.59"/><path d="m15.05 5.7-.218-.691a3 3 0 0 0-5.663 0L4.418 19.695A1 1 0 0 0 5.37 21h13.253a1 1 0 0 0 .951-1.31L18.45 16.2"/><circle cx="20" cy="9" r="2"/>', false], // lucide metronome
  listen: ['<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>', false], // lucide ear
}

export const icon = (name: keyof typeof P) =>
  `<svg class="i${P[name][1] ? ' solid' : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[name][0]}</svg>`
