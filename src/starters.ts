import type { Spec } from './song'

// Compositions are public domain; these arrangements were written for this project.
export interface Starter {
  spec: Spec
  by: string
  level: string
}

const arp = (a: string, b: string, c: string, d: string, e: string) =>
  `${a}:.5 ${b}:.5 ${c}:.5 ${d}:.5 ${e}:.5 ${c}:.5 ${d}:.5 ${e}:.5`

export const STARTERS: Starter[] = [
  {
    by: 'Warm-up',
    level: 'First notes',
    spec: {
      id: 'starter-five-finger',
      title: 'Five-finger warm-up',
      bpm: 72,
      fifths: 0,
      rh: 'C4:1 D4:1 E4:1 F4:1 G4:1 F4:1 E4:1 D4:1 C4:4 R:8',
      lh: 'R:8 C3:1 D3:1 E3:1 F3:1 G3:1 F3:1 E3:1 D3:1 C3:4',
    },
  },
  {
    by: 'Traditional',
    level: 'Beginner',
    spec: {
      id: 'starter-twinkle',
      title: 'Twinkle, Twinkle, Little Star',
      bpm: 84,
      fifths: 0,
      rh:
        'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 ' +
        'G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 ' +
        'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
      lh:
        'C3+G3:4 F3+C4:2 C3+G3:2 F3+C4:2 C3+G3:2 G3+D4:2 C3+G3:2 ' +
        'C3+G3:2 F3+C4:2 C3+G3:2 G3+D4:2 C3+G3:2 F3+C4:2 C3+G3:2 G3+D4:2 ' +
        'C3+G3:4 F3+C4:2 C3+G3:2 F3+C4:2 C3+G3:2 G3+D4:2 C3+G3:2',
    },
  },
  {
    by: 'Beethoven',
    level: 'Beginner',
    spec: {
      id: 'starter-ode-to-joy',
      title: 'Ode to Joy',
      bpm: 100,
      fifths: 0,
      rh:
        'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 ' +
        'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2 ' +
        'D4:1 D4:1 E4:1 C4:1 D4:1 E4:.5 F4:.5 E4:1 C4:1 D4:1 E4:.5 F4:.5 E4:1 D4:1 C4:1 D4:1 G3:2 ' +
        'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2',
      lh:
        'C3+G3:4 C3+G3:4 C3+G3:4 G2+D3:4 C3+G3:4 C3+G3:4 C3+G3:4 G2+D3:2 C3+G3:2 ' +
        'G2+D3:4 G2+D3:4 G2+D3:4 G2+D3:4 C3+G3:4 C3+G3:4 C3+G3:4 G2+D3:2 C3+G3:2',
    },
  },
  {
    by: 'Petzold, attrib. Bach',
    level: 'Elementary',
    spec: {
      id: 'starter-minuet-g',
      title: 'Minuet in G (first strain)',
      bpm: 112,
      sig: [3, 4],
      fifths: 1,
      rh:
        'D5:1 G4:.5 A4:.5 B4:.5 C5:.5 D5:1 G4:1 G4:1 E5:1 C5:.5 D5:.5 E5:.5 F#5:.5 G5:1 G4:1 G4:1 ' +
        'C5:1 D5:.5 C5:.5 B4:.5 A4:.5 B4:1 C5:.5 B4:.5 A4:.5 G4:.5 F#4:1 G4:.5 A4:.5 B4:.5 G4:.5 A4:3',
      lh: 'G2+D3:3 G2+D3:3 C3+G3:3 G2+D3:3 C3+G3:3 G2+D3:3 D3+A3:3 D3+A3:3',
    },
  },
  {
    by: 'After Bach, BWV 846',
    level: 'Elementary',
    spec: {
      id: 'starter-arpeggio-c',
      title: 'Arpeggio study in C',
      bpm: 60,
      fifths: 0,
      rh:
        [
          arp('C4', 'E4', 'G4', 'C5', 'E5'),
          arp('C4', 'E4', 'G4', 'C5', 'E5'),
          arp('C4', 'D4', 'A4', 'D5', 'F5'),
          arp('C4', 'D4', 'A4', 'D5', 'F5'),
          arp('B3', 'D4', 'G4', 'D5', 'F5'),
          arp('B3', 'D4', 'G4', 'D5', 'F5'),
          arp('C4', 'E4', 'G4', 'C5', 'E5'),
          arp('C4', 'E4', 'G4', 'C5', 'E5'),
        ].join(' ') + ' C5+E5+G5:4',
      lh: 'C3:8 C3:8 B2:8 C3:8 C2+C3:4',
    },
  },
  {
    by: 'Traditional, 16th c.',
    level: 'Elementary',
    spec: {
      id: 'starter-greensleeves',
      title: 'Greensleeves',
      bpm: 96,
      sig: [3, 4],
      fifths: 0,
      rh:
        'R:2 A4:1 C5:2 D5:1 E5:1.5 F5:.5 E5:1 D5:2 B4:1 G4:1.5 A4:.5 B4:1 C5:2 A4:1 A4:1.5 G#4:.5 A4:1 B4:2 G#4:1 ' +
        'E4:2 A4:1 C5:2 D5:1 E5:1.5 F5:.5 E5:1 D5:2 B4:1 G4:1.5 A4:.5 B4:1 C5:1.5 B4:.5 A4:1 G#4:1.5 F#4:.5 G#4:1 A4:3',
      lh:
        'R:3 A2+E3:3 A2+E3:3 G2+D3:3 G2+D3:3 A2+E3:3 A2+E3:3 E2+B2:3 E2+B2:3 ' +
        'A2+E3:3 A2+E3:3 G2+D3:3 G2+D3:3 A2+E3:3 E2+B2:3 A2+E3:3',
    },
  },
  {
    by: 'Pachelbel',
    level: 'Intermediate',
    spec: {
      id: 'starter-canon-d',
      title: 'Canon in D',
      bpm: 72,
      fifths: 2,
      rh:
        'F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2 ' +
        [
          ['D4', 'F#4', 'A4', 'F#4'],
          ['C#4', 'E4', 'A4', 'E4'],
          ['D4', 'F#4', 'B4', 'F#4'],
          ['C#4', 'F#4', 'A4', 'F#4'],
          ['B3', 'D4', 'G4', 'D4'],
          ['D4', 'F#4', 'A4', 'F#4'],
          ['B3', 'D4', 'G4', 'D4'],
          ['C#4', 'E4', 'A4', 'E4'],
        ]
          .map((g) => g.map((n) => `${n}:.5`).join(' '))
          .join(' '),
      lh: 'D3:2 A2:2 B2:2 F#2:2 G2:2 D3:2 G2:2 A2:2 D3:2 A2:2 B2:2 F#2:2 G2:2 D3:2 G2:2 A2:2',
    },
  },
  {
    by: 'Beethoven',
    level: 'Intermediate',
    spec: {
      id: 'starter-fur-elise',
      title: 'Für Elise (opening)',
      bpm: 80,
      sig: [3, 8],
      fifths: 0,
      rh:
        'R:1 E5:.25 D#5:.25 ' +
        'E5:.25 D#5:.25 E5:.25 B4:.25 D5:.25 C5:.25 A4:.5 R:.25 C4:.25 E4:.25 A4:.25 B4:.5 R:.25 E4:.25 G#4:.25 B4:.25 ' +
        'C5:.5 R:.25 E4:.25 E5:.25 D#5:.25 E5:.25 D#5:.25 E5:.25 B4:.25 D5:.25 C5:.25 A4:.5 R:.25 C4:.25 E4:.25 A4:.25 ' +
        'B4:.5 R:.25 E4:.25 C5:.25 B4:.25 A4:1.5',
      lh: 'R:1.5 R:1.5 A2:1.5 E2:1.5 A2:1.5 R:1.5 A2:1.5 E2:1.5 A2:1.5',
    },
  },
]
