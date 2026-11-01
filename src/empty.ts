// The two empty-state drawings (design/identity/SPEC.md, "Empty states"): engraved diagrams on paper, one ink, no motion.
// Geometry is boards.html's connectionSvg() and emptyScoreSvg(), recoloured to currentColor. aria-hidden: the sentence beside them says it.
import './empty.css'

const art = (svg: string) => `<span class="art" aria-hidden="true"><svg viewBox="0 0 160 160" focusable="false">${svg}</svg></span>`

/** No keyboard connected: two key/device rectangles and the dot between them. */
export const noKeyboardArt = () => art('<g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="square"><path d="M26 52h44v56H26zM90 52h44v56H90z"/><path d="M70 80h20" stroke-dasharray="6 9"/></g><circle cx="80" cy="80" r="7" fill="currentColor"/>')

/** No music here yet: five staff lines between two end bars and a faint notehead. */
export const noMusicArt = () => art('<g stroke="currentColor" fill="none" stroke-width="3"><path d="M24 52h112M24 66h112M24 80h112M24 94h112M24 108h112"/><path d="M24 48v64M136 48v64" stroke-width="6"/></g><circle cx="80" cy="80" r="8" fill="currentColor" fill-opacity=".18"/>')

/** The Songs page's empty "Your files": the drawing, then the sentence. */
export const noMusic = (text: string) => `<div class="emptybox">${noMusicArt()}<p>${text}</p></div>`
