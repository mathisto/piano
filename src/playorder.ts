/** One stretch of a score as a player reads it (a MusicXML measure, or a piece of a LilyPond score between repeat signs and marks). */
export interface Unit {
  forward?: boolean // a repeat starts here
  backward?: boolean // a repeat ends here
  times?: number // passes of that repeat (2 when the score does not say)
  ending?: number[] // the passes this stretch belongs to, when it is part of a first or second ending
  marks: Set<string> // dc ds segno tocoda coda sign (a bare coda sign) fine
}

/**
 * The order the units are played in: repeat signs, first and second endings, then one D.C. or D.S. jump with al Fine or
 * al Coda (no repeats on the way back, last ending only). `any`: the score has a jump or coda; `ok`: it could place them
 * (no segno, a To Coda with no Coda, two jumps: not ok, and nothing is jumped). `strophic`: a Fine with no jump ends the
 * last pass of a repeat (a strophic song's postlude).
 */
export function expand(units: Unit[], strophic = true): { order: number[]; any: boolean; ok: boolean } {
  const marks = units.map((u) => u.marks)
  const at = (k: string) => marks.flatMap((m, i) => (m.has(k) ? [i] : []))
  // bare coda signs: the last is the Coda, an earlier one the To Coda
  const signs = at('sign')
  if (signs.length && !at('coda').length) marks[signs[signs.length - 1]].add('coda')
  if (signs.length > 1 && !at('tocoda').length) marks[signs[0]].add('tocoda')
  const jumps = [...at('dc'), ...at('ds')]
  const [tocoda, coda] = [at('tocoda')[0], at('coda')[0]]
  const any = jumps.length > 0 || tocoda !== undefined || coda !== undefined
  const target = jumps.length === 1 ? (marks[jumps[0]].has('ds') ? at('segno')[0] : 0) : undefined
  const ok = target !== undefined && target <= jumps[0] && (tocoda === undefined) === (coda === undefined) && (coda === undefined || (tocoda < coda && coda > jumps[0]))
  const jump = ok ? jumps[0] : undefined

  const ending = units.map((u) => u.ending)
  // after a jump only the last ending of each set is played
  const last = ending.map((e, i) => {
    if (!e) return false
    let a = i
    let b = i
    while (ending[a - 1]) a--
    while (ending[b + 1]) b++
    return e.includes(Math.max(...ending.slice(a, b + 1).flatMap((x) => x!)))
  })
  const order: number[] = []
  let from = 0
  let pass = 1
  let final = false // on the last pass of a repeat
  let jumped = false
  for (let i = 0; i < units.length && order.length < 5000; ) {
    if (units[i].forward && i !== from) {
      from = i
      pass = 1
      final = false
    }
    if (ending[i] && !(jumped ? last[i] : ending[i]!.includes(pass))) {
      i++
      continue
    }
    order.push(i)
    if (units[i].backward && pass < (units[i].times ?? 2) && !jumped) {
      pass++
      final = pass === (units[i].times ?? 2)
      i = from
      continue
    }
    if (units[i].backward) {
      from = i + 1
      pass = 1
      final = false
    }
    if (marks[i].has('fine') && (jumped || (strophic && final && !any))) break
    if (jumped && i === tocoda) i = coda!
    else if (!jumped && i === jump) {
      jumped = true
      i = from = target!
    } else i++
  }
  return { order, any, ok }
}
