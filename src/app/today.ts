// Today and Progress: the plan for the day, the Path, and starting whatever they name.
import * as lib from '../catalog'
import { dayNum } from '../drill'
import { type Ctx, nextOf, path as gradePath, type Start } from '../grades'
import { type PlanMin, theoryDue } from '../plan'
import { pickPiece } from '../readthrough'
import { DEFAULT_RUN } from '../run'
import { keyName, mastery as scaleMastery, nextCard, nextStage as nextScaleStage, STAGES as SCALE_STAGES } from '../scales'
import { save, settings } from '../settings'
import * as store from '../store'
import { streak as dayStreak } from '../streak'
import { nextRecipe, stateOf, SYLLABUS, type TechStats } from '../syllabus'
import { exercise, PATTERNS } from '../technique'
import { $, todayView } from '../ui'
import { dayKey, improved, lastWeek, weekOf } from '../week'
import { firstUse, type Go, guideDay, guideDid, guideSave, guideState } from '../guide'
import { drillStats, hooks, stageById } from './state'
import { worstBars } from '../util'
import { libraryData } from './library'
import { fixBars, openById, openSong } from './play'
import { readThrough, rtPieces } from './readthrough-ui'
import { startDrill, startRun } from './drill'
import { stageRows } from './read'
import { theory } from './lazy'
import { startScale } from './scales-ui'
import { memorise } from './memorise-ui'

export async function showToday() {
  const [{ last, all }, rows, days, done] = await Promise.all([libraryData(), stageRows(), store.getPractice(), store.getPlan(dayKey())])
  const next = rows.find((r) => r.next)!
  const ts = await store.getTech()
  const nr = nextRecipe(ts, dayNum())
  const ex = exercise(nr.recipe.opts, settings.edges)
  const worst = last.prog?.heat.length ? worstBars(last.prog.heat, last.bars) : null
  const second = rows.find((r) => r.due && !r.next) // a second stage with cards due, for the longest plan
  const ctx = await pathCtx(ts)
  const nx = nextOf(gradePath(ctx))
  const sst = nextScaleStage(ctx.scales)
  const td = theoryDue(ctx.theory)
  const PATH_STEP = { scale: 'scale', read: 'read', tech: 'warm', theory: 'theory' } // the plan step that does a requirement
  // one snapshot a week lets the recap say what got better; the recap shows on Monday and Tuesday
  const week = weekOf(days).days
  const snap = { read: Object.fromEntries(rows.map((r) => [r.stage.id, r.pct])), tech: SYLLABUS.filter((r) => stateOf(ts, r.id, dayNum()) === 'solid').length }
  if (!(await store.getSnap(week[0].key))) await store.putSnap(week[0].key, snap)
  const lw = [1, 2].includes(new Date().getDay()) ? lastWeek(days, settings.goal) : null
  const prevKey = dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7 - ((new Date().getDay() + 6) % 7)))
  const sight = pickPiece(rtPieces(), await store.allProgress())
  const recap = lw ? { ...lw, better: improved(await store.getSnap(prevKey), snap, Object.fromEntries(rows.map((r) => [r.stage.id, r.stage.name]))) ?? undefined } : null
  const guide = await firstWeek(days)
  todayView($('#today'), {
    guide,
    last: { id: last.id, title: last.title, sub: last.prog?.best ? `Best ${Math.round(last.prog.best.acc * 100)}%` : last.sub, first: !last.prog?.last },
    again: (() => {
      const r = all.filter((x) => x.prog?.due !== undefined && x.prog.due <= dayNum() && x.id !== last.id).sort((a, b) => a.prog!.due! - b.prog!.due!)[0]
      return r ? { id: r.id, title: r.title, sub: 'Due for another go' } : undefined
    })(),
    read: { id: next.stage.id, name: next.due ? `Review ${next.stage.name.toLowerCase()}` : next.stage.name, pct: next.pct, line: next.due ? `${next.due} ${next.due === 1 ? 'card' : 'cards'} due` : next.seen ? `${next.seen} of ${next.total} notes seen` : next.stage.blurb },
    tech: ex.title.charAt(0).toUpperCase() + ex.title.slice(1),
    techDue: nr.reason === 'due',
    techId: nr.recipe.id,
    fix: worst && last.bars ? { id: last.id, title: last.title, ...worst } : undefined,
    review: second ? { id: second.stage.id, name: `Review ${second.stage.name.toLowerCase()}`, line: `${second.due} ${second.due === 1 ? 'card' : 'cards'} due` } : undefined,
    week: weekOf(days),
    goal: settings.goal,
    planMin: settings.planMin,
    streak: dayStreak(days),
    scale: { title: `Scales: ${sst.name}`, sub: `Next: ${keyName(nextCard(sst, ctx.scales).tonic, nextCard(sst, ctx.scales).form)}, at ${sst.bpm} bpm`, pct: scaleMastery(sst, ctx.scales).pct, start: { kind: 'scale', id: sst.id } },
    theory: td && { title: `Theory: ${td.name}`, sub: `${td.due} ${td.due === 1 ? 'card' : 'cards'} due for review`, start: { kind: 'theory', trainer: td.trainer, level: td.level } },
    path: nx?.start && nx.start.kind !== 'scale' ? { title: `Path: ${nx.name}`, sub: `Level ${nx.level}. ${nx.detail}`, start: nx.start } : undefined,
    done: nx?.start && done.includes(PATH_STEP[nx.start.kind]) ? [...done, 'path'] : done,
    recap: recap ?? undefined,
    sight: sight && { id: sight.piece.id, title: sight.piece.title, sub: `Read through, no stopping · ${sight.fresh ? 'new ' : ''}${sight.piece.level}` },
  })
  $('#today').querySelectorAll<HTMLInputElement>('input[name=planMin]').forEach((r) => (r.onchange = () => {
    settings.planMin = Number(r.value) as PlanMin
    save()
    void showToday()
  }))
}

/** The first-week card: the plan records since first use say what is done. Null once hidden, finished or past day 8. */
async function firstWeek(days: Record<string, number>) {
  const st = guideState()
  const t = new Date()
  const today = dayNum()
  const first = firstUse(days, today, st.first)
  if (st.first === undefined) guideSave({ first })
  if (st.off || today - first > 7) return null
  const plans = await Promise.all(Array.from({ length: today - first + 1 }, (_, i) => store.getPlan(dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() - i)))))
  const mem = [...(await store.allProgress()).values()].some((p) => (p.memStage ?? 0) > 0 && (p.memDay ?? 0) >= first)
  return guideDay(first, today, [...plans.flat(), ...st.did, ...(mem ? ['mem'] : [])], st.skip)
}

/** What a first-week Start opens: the same starts Today and the Path use. */
const GUIDE_GO: Record<Go, () => void | Promise<void>> = {
  read: () => startReq({ kind: 'read', id: 't-land' }),
  scale: () => startScale({ tonic: 0, form: 'major', hands: 'R', oct: 1 }, 60),
  theory: () => startReq({ kind: 'theory', trainer: 'chords', level: 1 }),
  sight: () => readThrough(),
  tech: () => startReq({ kind: 'tech', id: SYLLABUS[0].id }),
  mem: () => memorise('starter-twinkle'),
  progress: () => hooks.showSection('progress'),
}

export async function showProgress() {
  guideDid('progress')
  const [stages, days, log, ts, history] = await Promise.all([stageRows(), store.getPractice(), store.getTouch(), store.getTech(), store.getHistory()])
  const today = dayNum()
  const gp = gradePath(await pathCtx(ts))
  const [{ ladderState }, { LADDER }, { progressView }] = await Promise.all([import('../ladder'), import('../ladder-data'), import('../ui-views')])
  const ladder = ladderState(LADDER, await store.allProgress(), (id) => {
    const x = lib.piece(id)
    return x && { title: x.title, composer: lib.catalog.composers[x.composer]?.name ?? '' }
  })
  progressView($('#progress'), { week: weekOf(days), goal: settings.goal, streak: dayStreak(days), path: gp, ladder, next: nextOf(gp), stages, log, history, stats: drillStats, tech: SYLLABUS.map((r) => ({ id: r.id, label: r.label, group: PATTERNS[r.opts.pattern], state: stateOf(ts, r.id, today) })) })
  $('#pGoal').addEventListener('change', (e) => {
    settings.goal = Number((e.target as HTMLSelectElement).value)
    save()
    void showProgress()
  })
}

/** The state every Path requirement is judged from. */
async function pathCtx(tech?: TechStats): Promise<Ctx> {
  const [scales, theory, t] = await Promise.all([store.getScales(), store.getTheory(), tech ?? store.getTech()])
  return { scales, drill: drillStats, tech: t, theory, day: dayNum() }
}

/** Start whatever a Path requirement or a Today row names. */
async function startReq(s: Start) {
  if (s.kind === 'scale') {
    const st = SCALE_STAGES.find((x) => x.id === s.id)!
    startScale(nextCard(st, await store.getScales()), st.bpm)
  } else if (s.kind === 'read') void startDrill(stageById(s.id)!, s.fast)
  else if (s.kind === 'tech') void openSong(exercise((SYLLABUS.find((r) => r.id === s.id) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
  else {
    const t = await theory()
    t.theoryLevels[s.trainer] = s.level
    await hooks.showSection('theory')
    await t.startTheory(s.trainer)
  }
}

/** Open a ladder piece in Learn; one not on the device is fetched first, so say so, and say plainly when that fails. */
async function startPiece(b: HTMLButtonElement) {
  const p = lib.piece(b.dataset.ladder!)
  const msg = b.closest('details')!.querySelector('.ladder-msg')!
  if (!p) return
  msg.textContent = ''
  if (!lib.local(p.id)) {
    const st = b.closest('li')!.querySelector('.rqs span')!
    const was = st.textContent
    st.textContent = 'Downloading'
    b.disabled = true
    try {
      await lib.pieceBytes(p)
    } catch {
      msg.textContent = `${p.title} could not be downloaded. You may be offline; check the connection and try again.`
      return
    } finally {
      st.textContent = was
      b.disabled = false
    }
  }
  await openById(`lib:${p.id}`, 'learn')
}

$('#progress').addEventListener('click', (e) => {
  const lb = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-ladder]')
  if (lb) return void startPiece(lb)
  const st = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-start]')
  if (st) return void startReq(JSON.parse(st.dataset.start!))
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button.cell')
  if (b?.dataset.stage) void startDrill(stageById(b.dataset.stage)!)
  else if (b?.dataset.recipe) void openSong(exercise((SYLLABUS.find((r) => r.id === b.dataset.recipe) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
})

// a tab's one-line note closes for good: guide.ts already counted it as seen
document.addEventListener('click', (e) => (e.target as HTMLElement).closest('button[data-guide=note]')?.parentElement?.remove())

$('#today').addEventListener('click', (e) => {
  const g = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-goal]')
  if (g) {
    settings.goal = Number(g.dataset.goal)
    save()
    return void showToday()
  }
  const gd = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-guide]')
  if (gd) {
    if (gd.dataset.guide === 'hide') guideSave({ off: true })
    else guideSave({ skip: [...guideState().skip, Number(gd.dataset.n)] })
    return void showToday()
  }
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-today]')
  if (!b) return
  if (b.dataset.today === 'guide') void GUIDE_GO[b.dataset.go as Go]()
  else if (b.dataset.today === 'start') void startReq(JSON.parse(b.dataset.start!))
  else if (b.dataset.today === 'run') void store.getRuns().then((r) => startRun({ ...DEFAULT_RUN, ...r.last }))
  else if (b.dataset.today === 'continue') void openById(b.dataset.id!, 'learn')
  else if (b.dataset.today === 'fix') void fixBars(b.dataset.id!, Number(b.dataset.a), Number(b.dataset.b))
  else if (b.dataset.today === 'read') void startDrill(stageById(b.dataset.id!)!)
  else if (b.dataset.today === 'sight') void readThrough(b.dataset.id)
  else void openSong(exercise((SYLLABUS.find((r) => r.id === b.dataset.id) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
})
