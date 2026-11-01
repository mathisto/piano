// Today and Progress: the plan for the day, the Path, and starting whatever they name.
import * as lib from '../catalog'
import { dayNum } from '../drill'
import { type Ctx, nextOf, path as gradePath, type Start } from '../grades'
import { planOf, type PlanMin, theoryDue } from '../plan'
import type { Snap } from '../next'
import { pickPiece } from '../readthrough'
import { DEFAULT_RUN } from '../run'
import { keyName, mastery as scaleMastery, nextCard, nextStage as nextScaleStage, STAGES as SCALE_STAGES } from '../scales'
import { save, settings } from '../settings'
import * as store from '../store'
import { streak as dayStreak } from '../streak'
import { nextRecipe, stateOf, SYLLABUS, type TechStats } from '../syllabus'
import { exercise, PATTERNS } from '../technique'
import { $, type TodayData } from '../ui'
import { dayKey, improved, lastWeek, weekOf } from '../week'
import { firstUse, type Go, guideDay, guideDid, guideSave, guideState } from '../guide'
import { current, drillStats, hooks, stageById } from './state'
import { worstBars } from '../util'
import { coverSong, libraryData } from './library'
import { endFeatures, leave, openAt, openById, openSong } from './play'
import { readThrough, rtPieces } from './readthrough-ui'
import { startDrill, startRun } from './drill'
import { stageRows } from './read'
import { cover, theory } from './lazy'
import { startScale } from './scales-ui'
import { memorise } from './memorise-ui'

/** What Today gathers: every row it can offer, the plan, the first week's step and what the Path asks next. Today draws it; Continue reads it (next.ts). */
async function snapshot() {
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
  const td = await theoryDue(ctx.theory).catch(() => undefined) // the Theory code did not load: Today without its Theory row
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
  const [{ coverHtml }, { todayRows }] = await Promise.all([cover(), import('../today-view')]) // the rows' words and buttons load with the page
  const d: TodayData = {
    guide,
    last: { id: last.id, title: last.title, sub: last.prog?.best ? `Best ${Math.round(last.prog.best.acc * 100)}%` : last.sub, first: !last.prog?.last, cover: coverHtml(last.id, 'thumb', last.cover), pace: last.prog?.pace },
    again: (() => {
      const r = all.filter((x) => x.prog?.due !== undefined && x.prog.due <= dayNum() && x.id !== last.id).sort((a, b) => a.prog!.due! - b.prog!.due!)[0]
      return r ? { id: r.id, title: r.title, sub: 'Due for review' } : undefined
    })(),
    read: { id: next.stage.id, name: next.due ? `Review: ${next.stage.name}` : next.stage.name, pct: next.pct, due: next.due, line: next.due ? `${next.due} ${next.due === 1 ? 'card' : 'cards'} due` : next.seen ? `${next.seen} of ${next.total} notes seen` : next.stage.blurb },
    tech: ex.title.charAt(0).toUpperCase() + ex.title.slice(1),
    techDue: nr.reason === 'due',
    techId: nr.recipe.id,
    fix: worst && last.bars ? { id: last.id, title: last.title, ...worst } : undefined,
    review: second ? { id: second.stage.id, name: `Review: ${second.stage.name}`, due: second.due, line: `${second.due} ${second.due === 1 ? 'card' : 'cards'} due` } : undefined,
    week: weekOf(days),
    goal: settings.goal,
    planMin: settings.planMin,
    streak: dayStreak(days),
    scale: { title: `Scales: ${sst.name.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}`, sub: `Next: ${keyName(nextCard(sst, ctx.scales).tonic, nextCard(sst, ctx.scales).form)}, at ${sst.bpm} bpm`, pct: scaleMastery(sst, ctx.scales).pct, start: { kind: 'scale', id: sst.id } },
    theory: td && { due: td.due, title: `Theory: ${td.name}`, sub: `${td.due} ${td.due === 1 ? 'card' : 'cards'} due for review`, start: { kind: 'theory', trainer: td.trainer, level: td.level } },
    path: nx?.start && nx.start.kind !== 'scale' ? { title: `Path: ${nx.name}`, sub: `Level ${nx.level}. ${nx.detail}`, start: nx.start } : undefined,
    done: nx?.start && done.includes(PATH_STEP[nx.start.kind]) ? [...done, 'path'] : done,
    recap: recap ?? undefined,
    sight: sight && { id: sight.piece.id, title: sight.piece.title, sub: `One pass, no stopping · ${sight.fresh ? 'a new piece, ' : ''}${sight.piece.level}` },
  }
  const units = todayRows(d)
  const now = guide?.rows.find((r) => r.state === 'now')?.step
  const at: Snap = {
    rows: units,
    plan: planOf(d.planMin, units.map((r) => r.key)).map((r) => r.key),
    done: d.done,
    guide: now && { key: 'guide', title: now.title, sub: now.sub, go: { today: 'guide', go: now.go } },
    path: d.path ? 'path' : nx?.start?.kind === 'scale' ? 'scale' : undefined,
  }
  return { d, at }
}

export async function showToday() {
  const [{ d, at }, { nextUp }, { drawCovers }, { todayView }] = await Promise.all([snapshot(), import('../next'), cover(), import('../today-view')])
  todayView($('#today'), d, nextUp(at))
  drawCovers($('#today'), coverSong)
  $('#today').querySelectorAll<HTMLInputElement>('input[name=planMin]').forEach((r) => (r.onchange = () => planLen(Number(r.value) as PlanMin)))
}
const planLen = (m: PlanMin) => {
  settings.planMin = m
  save()
  void showToday()
}

/** Continue on a results card: what comes next, and how to start it from wherever the player is. */
hooks.next = async (after) => {
  const [{ at }, { nextUp }] = await Promise.all([snapshot(), import('../next')])
  const u = nextUp({ ...at, after })
  const g = u.go ?? {}
  return {
    ...u,
    async start() {
      endFeatures() // the drill, run or read-through that ended stays ended
      if (current && (kindOf(g) === 'theory' || g.go === 'progress')) await leave() // a page, not a piece: off the play screen first
      store.offered({ kind: kindOf(g), by: u.by })
      launch(g)
    },
  }
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
  progressView($('#progress'), { week: weekOf(days), goal: settings.goal, streak: dayStreak(days), path: gp, ladder, next: nextOf(gp), stages, log, history: history.filter((e) => !e.as), stats: drillStats, tech: SYLLABUS.map((r) => ({ id: r.id, label: r.label, group: PATTERNS[r.opts.pattern], state: stateOf(ts, r.id, today) })) })
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
  const pl = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-plan]')
  if (pl) return planLen(Number(pl.dataset.plan) as PlanMin)
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-today]')
  if (!b) return
  store.offered({ kind: kindOf(b.dataset), by: b.dataset.by ?? 'plan' }) // the row the player took says which rule offered it
  launch(b.dataset)
})

/** The kind of history row a start leads to, so the row can say what offered it. */
const KIND: Record<string, store.HistoryEntry['kind']> = { tech: 'tech', read: 'read', continue: 'song', fix: 'song', sight: 'song', mem: 'song', run: 'run', scale: 'scale', theory: 'theory' }
const kindOf = (g: Record<string, string | undefined>) => KIND[(g.today === 'start' ? JSON.parse(g.start!).kind : g.today === 'guide' ? g.go : g.today) ?? '']

/** Start what a Today button, or Continue, names: `g` is the button's data. */
function launch(g: Record<string, string | undefined>) {
  if (g.today === 'guide') void GUIDE_GO[g.go as Go]()
  else if (g.today === 'start') void startReq(JSON.parse(g.start!))
  else if (g.today === 'run') void store.getRuns().then((r) => startRun({ ...DEFAULT_RUN, ...r.last }))
  else if (g.today === 'continue') void openAt(g.id!, { rate: Number(g.rate) || undefined, nowait: !!g.nowait })
  else if (g.today === 'fix') void openAt(g.id!, { rate: 0.7, loop: [Number(g.a), Number(g.b)] })
  else if (g.today === 'read') void startDrill(stageById(g.id!)!)
  else if (g.today === 'sight') void readThrough(g.id)
  else void openSong(exercise((SYLLABUS.find((r) => r.id === g.id) ?? SYLLABUS[0]).opts, settings.edges), 'perform')
}
