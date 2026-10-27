// Scales: the stages, a free pick, and the degree quiz.
import { type Card as ScaleCard, type Form, mastery as scaleMastery, nextCard, nextStage as nextScaleStage, quizDeal, quizRecord, quizRight, type QuizStats, scaleSong, STAGES as SCALE_STAGES } from '../scales'
import * as store from '../store'
import { $, type QuizState, type ScalePick, scalesView } from '../ui'
import { openSong } from './play'

let scaleTab: 'stages' | 'pick' | 'quiz' = 'stages'
export let quiz: QuizState | undefined
let quizStats: QuizStats = {}

async function newQuiz() {
  quizStats = await store.getQuiz()
  quiz = { cards: quizDeal(quizStats, 10), i: 0, ok: 0, streak: 0, best: 0 }
}

/** A degree chosen, by tap or by pressing its note: score it, keep the stats, show the reason. */
export function answerQuiz(degree: number) {
  if (!quiz || quiz.picked !== undefined || quiz.i >= quiz.cards.length) return
  const ok = quizRight(quiz.cards[quiz.i], degree)
  quiz.picked = degree
  quiz.streak = ok ? quiz.streak + 1 : 0
  quiz.best = Math.max(quiz.best, quiz.streak)
  if (ok) quiz.ok++
  quizRecord(quizStats, quiz.cards[quiz.i], ok)
  void store.saveQuiz(quizStats)
  void showScales()
}
export const quizOpen = () => $('#scales').classList.contains('on') && scaleTab === 'quiz' && !!quiz
let scalePick: ScalePick = { tonic: 0, form: 'major', hands: 'R', oct: 1, bpm: 60 }

export async function showScales() {
  const stats = await store.getScales()
  const f = nextScaleStage(stats)
  if (scaleTab === 'quiz' && !quiz) await newQuiz()
  scalesView($('#scales'), SCALE_STAGES.map((stage) => ({ stage, ...scaleMastery(stage, stats), next: stage === f, card: nextCard(stage, stats) })), scaleTab, scalePick, quiz)
}

export const startScale = (c: ScaleCard, bpm: number) => void openSong(scaleSong(c, bpm), 'perform')

$('#scales').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.name === 'scaleTab') {
    scaleTab = t.value as typeof scaleTab
    return void showScales()
  }
  const v = (id: string) => ($(`#${id}`, $('#scales')) as HTMLSelectElement | null)?.value
  if (!v('sgForm')) return
  const form = v('sgForm') as Form
  scalePick = { form, tonic: Number(v('sgKey')), hands: v('sgHands') as ScalePick['hands'], oct: Number(v('sgOct')) as 1 | 2, bpm: Number(v('sgBpm')) }
  if (t.id !== 'sgBpm') void showScales() // major and minor name the keys differently, and the fingering line follows the key
})
$('#scales').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  if (b.id === 'sgStart') startScale(scalePick, scalePick.bpm)
  else if (b.dataset.qd) answerQuiz(Number(b.dataset.qd))
  else if (b.id === 'qNext' && quiz) {
    quiz.i++
    quiz.picked = undefined
    void showScales()
  } else if (b.id === 'qAgain') void newQuiz().then(showScales)
  else if (b.dataset.sstage) {
    const st = SCALE_STAGES.find((x) => x.id === b.dataset.sstage)!
    void store.getScales().then((stats) => startScale(nextCard(st, stats), st.bpm))
  }
})
