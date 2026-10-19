const P: Record<string, [string, boolean]> = {
  play: ['<path d="M7 4.5v15l12-7.5z"/>', true],
  pause: ['<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>', true],
  restart: ['<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>', false],
  sliders: ['<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>', false],
  loop: ['<path d="M17 2l3 3-3 3"/><path d="M20 5H8a4 4 0 0 0-4 4v1"/><path d="M7 22l-3-3 3-3"/><path d="M4 19h12a4 4 0 0 0 4-4v-1"/>', false],
  plus: ['<path d="M12 5v14M5 12h14"/>', false],
  minus: ['<path d="M5 12h14"/>', false],
  x: ['<path d="M6 6l12 12M18 6L6 18"/>', false],
  back: ['<path d="M15 5l-7 7 7 7"/>', false],
  check: ['<path d="M5 12.5l4.5 4.5L19 7"/>', false],
  focus: ['<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', false],
}

export const icon = (name: keyof typeof P) =>
  `<svg class="i${P[name][1] ? ' solid' : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[name][0]}</svg>`
