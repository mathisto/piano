import type { Song } from './song'

/**
 * Machine-readable notes on an imported song, for the ingestion pipeline's quality gates. From the importers:
 * 'dc-ds', 'repeats-unexpanded', 'double-accidental', 'no-tempo' (nothing names a pace: 100 bpm), 'tempo-estimated' (only a tempo word does: the bpm is a guess), 'three-track-midi'; read off the song:
 * 'key-changes', 'irregular-tuplet' (anything but a triplet).
 */
export function scoreFlags(song: Song): string[] {
  const f = new Set(song.flags)
  if ((song.keys?.length ?? 0) > 1) f.add('key-changes')
  if (song.notes.some((n) => n.tuplet && n.tuplet.num * 2 !== n.tuplet.den * 3)) f.add('irregular-tuplet')
  return [...f].sort()
}
