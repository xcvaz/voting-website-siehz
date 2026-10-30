'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '@/utils/supabase'

/* ========================================================================
   TYPES
   ======================================================================== */
interface Poll {
  id: string
  question: string
}

interface Option {
  id: string
  poll_id: string
  text: string
  image_url?: string
  votes: number
}

/* ========================================================================
   LOOK & FEEL — EDIT HERE
   ======================================================================== */
const TAB_TITLE = 'Association Election'
const TAB_EMOJI = '👑'
const BRAND = 'Siehz'

const HERO_EYEBROW = 'ECE Department · Election closed'
const HERO_SUBTEXT = 'Every vote is counted. Congratulations to the Winners'
const HERO_BUTTON = 'See the winners'
const FOOTER_TEXT = 'Thank you to everyone who voted. 💖'

const BAR_COLORS = ['#ff6b9d', '#7c5cff', '#ffb020', '#19c3a0', '#3b9cff', '#ff7a45']
const FALL_EMOJI = ['✨', '💖', '🔥', '⭐', '🎉', '👑']
const SPLASH_MESSAGES = ['counting the votes', 'checking twice', 'polishing the crown', 'almost there']
const SHAPES = [
  { c: '✦', x: '6%', y: '16%', s: 44, t: 9 },
  { c: '✿', x: '90%', y: '10%', s: 58, t: 11 },
  { c: '◯', x: '12%', y: '60%', s: 64, t: 8 },
  { c: '✚', x: '86%', y: '46%', s: 40, t: 10 },
  { c: '☺', x: '70%', y: '84%', s: 52, t: 12 },
  { c: '▲', x: '30%', y: '90%', s: 34, t: 7 },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');
html { scroll-behavior: smooth; }
.vote-root {
  --ink: #15132b; --muted: #6b6a80; --paper: #f7f7fc; --line: #e3e2f0;
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  color: var(--ink); background-color: var(--paper);
  background-image: radial-gradient(rgba(21,19,43,.07) 1px, transparent 1px);
  background-size: 22px 22px;
}
.display { font-family: 'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; }
.stripes {
  background-image: linear-gradient(135deg, rgba(255,255,255,.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.28) 75%, transparent 75%);
  background-size: 28px 28px; animation: march 1.4s linear infinite;
}
.shimmer::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
  transform: translateX(-100%); animation: sweep 2.2s ease-in-out infinite;
}
@keyframes rise     { from { transform: translateY(46px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes word     { from { transform: translateY(120%) rotate(5deg) } to { transform: none } }
@keyframes pop      { 0% { transform: scale(.6) } 60% { transform: scale(1.12) } 100% { transform: scale(1) } }
@keyframes bob      { 0%,100% { transform: translateY(0) rotate(-8deg) } 50% { transform: translateY(-9px) rotate(8deg) } }
@keyframes live     { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .3; transform: scale(.6) } }
@keyframes march    { to { background-position: 28px 0 } }
@keyframes sweep    { to { transform: translateX(100%) } }
@keyframes drift    { 0%,100% { transform: translate(0,0) rotate(0deg) } 33% { transform: translate(18px,-26px) rotate(14deg) } 66% { transform: translate(-16px,-10px) rotate(-12deg) } }
@keyframes aurora1  { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(14vw,10vh) scale(1.25) } }
@keyframes aurora2  { 0%,100% { transform: translate(0,0) scale(1.1) } 50% { transform: translate(-16vw,-8vh) scale(.9) } }
@keyframes aurora3  { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(8vw,-14vh) scale(1.3) } }
@keyframes draw     { from { stroke-dashoffset: 420 } to { stroke-dashoffset: 0 } }
@keyframes loadbar  { 0%,100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
@keyframes stripOut { 0% { transform: translateY(0); background-color: #f7f7fc } 25% { background-color: var(--c) } 100% { transform: translateY(-101%); background-color: var(--c) } }
@keyframes contentOut { to { opacity: 0; transform: scale(.92) translateY(-20px) } }
@keyframes splashFloat { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-22px) rotate(8deg) } }
@keyframes fall     { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0 } 10% { opacity: 1 } 100% { transform: translateY(110vh) rotate(360deg); opacity: 1 } }
@keyframes hueGlow  { 0%,100% { box-shadow: 6px 6px 0 #ff6b9d } 33% { box-shadow: 6px 6px 0 #7c5cff } 66% { box-shadow: 6px 6px 0 #19c3a0 } }
@keyframes wave     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-0.14em) } }
@keyframes nudge    { 0%,100% { transform: translateY(0) } 50% { transform: translateY(6px) } }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`

/* ========================================================================
   HELPERS + HOOKS
   ======================================================================== */
const byVotes = (arr: Option[]) => [...arr].sort((a, b) => b.votes - a.votes || a.text.localeCompare(b.text))

const pctOf = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

function useTicker(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const next = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)))
      fromRef.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/* ========================================================================
   SPLASH
   ======================================================================== */
function Splash({ loading, onDone }: { loading: boolean; onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [out, setOut] = useState(false)
  const loadingRef = useRef(loading)
  const doneRef = useRef(onDone)
  loadingRef.current = loading
  doneRef.current = onDone

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const raw = Math.min(100, (now - start) / 26)
      const p = loadingRef.current ? Math.min(raw, 92) : raw
      setPct(Math.floor(p))
      if (p >= 100) return setOut(true)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!out) return
    const t = setTimeout(() => doneRef.current(), 1250)
    return () => clearTimeout(t)
  }, [out])

  return (
    <div className="vote-root fixed inset-0 z-[100] overflow-hidden" style={{ background: 'transparent' }} aria-label="Loading">
      <div className="absolute inset-0 flex">
        {BAR_COLORS.map((c, i) => (
          <div
            key={c}
            className="flex-1"
            style={
              {
                '--c': c,
                backgroundColor: '#f7f7fc',
                animation: out ? `stripOut 750ms ${i * 80}ms cubic-bezier(.7,0,.2,1) forwards` : undefined,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {['✨', '💖', '🔥', '⭐', '🎉'].map((e, i) => (
        <span
          key={e}
          className="absolute text-3xl sm:text-5xl select-none"
          style={{
            left: `${10 + i * 19}%`,
            top: `${(i % 2 ? 18 : 70) + (i % 3) * 4}%`,
            animation: `splashFloat ${4 + i}s ease-in-out ${i * -0.8}s infinite`,
            opacity: out ? 0 : 0.9,
            transition: 'opacity 300ms',
          }}
        >
          {e}
        </span>
      ))}

      <div
        className="relative h-full flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ animation: out ? 'contentOut 500ms ease-in forwards' : undefined }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white px-4 py-1.5 shadow-[3px_3px_0_var(--ink)]">
          <span className="w-3 h-3 rounded-full bg-[#ff6b9d]" style={{ animation: 'live 1.2s ease-in-out infinite' }} />
          <span className="display font-extrabold text-sm">{BRAND}</span>
        </div>

        <div className="display font-extrabold leading-none tabular-nums" style={{ fontSize: 'clamp(5rem, 22vw, 11rem)' }}>
          {pct}
          <span className="text-[0.35em] text-[var(--muted)]">%</span>
        </div>

        <div className="flex items-end gap-2 sm:gap-3 h-20">
          {BAR_COLORS.map((c, i) => (
            <span
              key={c}
              className="w-6 sm:w-8 rounded-lg border-2 border-[var(--ink)] origin-bottom"
              style={{
                background: c,
                height: `${Math.max(14, Math.min(100, pct * (0.55 + i * 0.1)))}%`,
                transition: 'height 200ms ease-out',
                animation: `loadbar ${0.9 + i * 0.12}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <div className="w-64 sm:w-80 h-3 rounded-full border-2 border-[var(--ink)] bg-white overflow-hidden">
          <div className="relative h-full bg-[#7c5cff] shimmer overflow-hidden" style={{ width: `${pct}%`, transition: 'width 120ms linear' }} />
        </div>

        <p className="display text-lg sm:text-xl font-extrabold">{SPLASH_MESSAGES[Math.min(3, Math.floor(pct / 26))]}…</p>
      </div>
    </div>
  )
}

/* ========================================================================
   BACKDROP + SMALL UI
   ======================================================================== */
function Backdrop() {
  const blob = (color: string, pos: Record<string, string>, anim: string): CSSProperties => ({
    background: color,
    animation: `${anim} 22s ease-in-out infinite`,
    ...pos,
  })
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute w-[55vw] h-[55vw] rounded-full blur-[110px] opacity-40" style={blob('#ff6b9d', { left: '-10vw', top: '-10vw' }, 'aurora1')} />
      <div className="absolute w-[50vw] h-[50vw] rounded-full blur-[110px] opacity-35" style={blob('#7c5cff', { right: '-12vw', top: '20vh' }, 'aurora2')} />
      <div className="absolute w-[45vw] h-[45vw] rounded-full blur-[110px] opacity-35" style={blob('#19c3a0', { left: '20vw', bottom: '-15vw' }, 'aurora3')} />
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className="absolute leading-none opacity-40"
          style={{ left: s.x, top: s.y, fontSize: s.s, color: BAR_COLORS[i % BAR_COLORS.length], animation: `drift ${s.t}s ease-in-out ${i * -1.1}s infinite` }}
        >
          {s.c}
        </span>
      ))}
    </div>
  )
}

// One-time celebration shower when the page opens
function Shower({ on }: { on: boolean }) {
  if (!on) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {Array.from({ length: 26 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 text-2xl sm:text-3xl"
          style={{
            left: `${(i * 37) % 100}%`,
            opacity: 0,
            animation: `fall ${3.2 + (i % 5) * 0.5}s ${(i % 9) * 0.22}s ease-in forwards`,
          }}
        >
          {FALL_EMOJI[i % FALL_EMOJI.length]}
        </span>
      ))}
    </div>
  )
}

function ScrollBar() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (ref.current) ref.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 z-50">
      <div
        ref={ref}
        className="h-full origin-left"
        style={{ transform: 'scaleX(0)', background: 'linear-gradient(90deg,#ff6b9d,#ffb020,#19c3a0,#3b9cff,#7c5cff)' }}
      />
    </div>
  )
}

function BrandChip() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed top-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white/80 backdrop-blur px-3.5 py-1.5 shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5 hover:-rotate-2 active:scale-95"
    >
      <span className="w-3.5 h-3.5 rounded-full bg-[#7c5cff]" />
      <span className="display font-extrabold text-sm">{BRAND}</span>
    </button>
  )
}

/* ========================================================================
   HERO
   ======================================================================== */
function Hero({ ready }: { ready: boolean }) {
  const reveal = (delay: number): CSSProperties => ({
    animation: ready ? `rise 800ms ${delay}ms cubic-bezier(.2,.9,.3,1) both` : undefined,
    opacity: ready ? undefined : 0,
  })

  const line = (text: string, delay: number) => (
    <span className="block overflow-hidden pb-[0.12em]">
      <span
        className="inline-block"
        style={{
          transform: ready ? undefined : 'translateY(120%)',
          animation: ready ? `word 900ms ${delay}ms cubic-bezier(.2,.9,.3,1) both` : undefined,
        }}
      >
        {text}
      </span>
    </span>
  )

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-10 pt-28 pb-20 flex flex-col items-start">
        <div
          className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white pl-3 pr-4 py-1.5 shadow-[3px_3px_0_var(--ink)]"
          style={reveal(0)}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#19c3a0]" style={{ animation: 'live 1.4s ease-in-out infinite' }} />
          <span className="text-sm font-bold">{HERO_EYEBROW}</span>
        </div>

        <h1 className="display font-extrabold leading-[0.98] mt-8 sm:mt-10" style={{ fontSize: 'clamp(3.4rem, 11vw, 9rem)' }}>
          {line('The votes', 250)}
          {line('are in.', 380)}
          <span
            className="inline-block mt-3 rounded-[0.3em] border-[3px] border-[var(--ink)] px-[0.2em] -rotate-2 shadow-[6px_6px_0_var(--ink)] bg-[#ffb020]"
            style={reveal(700)}
          >
            {'Meet the leaders'.split('').map((ch, k) => (
              <span key={k} className="inline-block" style={{ whiteSpace: 'pre', animation: ready ? `wave 1.8s ease-in-out ${k * 0.08}s infinite` : undefined, fontSize: '0.4em' }}>
                {ch}
              </span>
            ))}
          </span>
        </h1>

        <p className="mt-8 max-w-md text-lg sm:text-xl font-medium text-[var(--muted)] leading-relaxed" style={reveal(1000)}>
          {HERO_SUBTEXT}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5" style={reveal(1150)}>
          <button
            type="button"
            onClick={() => document.getElementById('winners')?.scrollIntoView({ behavior: 'smooth' })}
            className="shimmer relative overflow-hidden display inline-flex items-center gap-3 rounded-full border-2 border-[var(--ink)] bg-[var(--ink)] px-8 py-4 sm:px-10 sm:py-5 text-xl sm:text-2xl font-extrabold text-white outline-none transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#7c5cff]"
            style={{ animation: 'hueGlow 4s linear infinite' }}
          >
            <span className="relative z-10">{HERO_BUTTON}</span>
            <span className="relative z-10 text-2xl" style={{ animation: 'nudge 1.2s ease-in-out infinite' }}>
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ========================================================================
   WINNERS WALL (one card per poll, click to reveal)
   ======================================================================== */
interface Result {
  poll: Poll
  options: Option[] // sorted by votes desc
  total: number
  winners: Option[]
}

function WinnerCard({ r, index, ready, revealed, onReveal }: { r: Result; index: number; ready: boolean; revealed: boolean; onReveal: () => void }) {
  const [ref, seen] = useInView<HTMLAnchorElement>(0.2)
  const live = ready && seen
  const color = BAR_COLORS[index % BAR_COLORS.length]
  const w = r.winners[0]
  const tie = r.winners.length > 1
  const pct = useTicker(live && revealed && w ? pctOf(w.votes, r.total) : 0)

  return (
    <a
      ref={ref}
      href={`#poll-${r.poll.id}`}
      onClick={(e) => {
        // First click reveals the winner; after that the link jumps to the full breakdown
        if (!revealed) {
          e.preventDefault()
          onReveal()
        }
      }}
      className="group relative flex flex-col rounded-[1.75rem] border-2 border-[var(--ink)] bg-white p-4 outline-none transition-transform duration-200 hover:-translate-y-1 hover:-rotate-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15132b]"
      style={{
        boxShadow: `6px 6px 0 ${color}, 6px 6px 0 2px var(--ink)`,
        animation: live ? `rise 700ms ${index * 100}ms cubic-bezier(.2,.9,.3,1) both` : undefined,
        opacity: live ? undefined : 0,
      }}
    >
      <p className="display text-base sm:text-lg font-extrabold leading-snug min-h-[3.2rem]">{r.poll.question}</p>

      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-2xl border-2 border-[var(--ink)]">
        {!revealed ? (
          <div
            className="stripes display w-full h-full flex flex-col items-center justify-center gap-2 text-center p-3"
            style={{ background: color }}
          >
            <span className="text-6xl sm:text-7xl leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
              🎁
            </span>
            <span className="display font-extrabold text-lg sm:text-xl bg-white border-2 border-[var(--ink)] rounded-full px-4 py-1 shadow-[3px_3px_0_var(--ink)]">
              Click to reveal
            </span>
          </div>
        ) : (
          <div className="w-full h-full" style={{ animation: 'pop 600ms both' }}>
            {w?.image_url ? (
              <img src={w.image_url} alt={w.text} draggable={false} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="display w-full h-full flex items-center justify-center font-extrabold p-3 text-center" style={{ background: color, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                {w ? w.text : '—'}
              </div>
            )}
            <span className="absolute top-3 left-3 text-3xl leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
              👑
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="display inline-block min-w-0 break-words rounded-full border-2 border-[var(--ink)] px-3.5 py-1 text-sm sm:text-base font-extrabold leading-tight" style={{ background: color }}>
          {!revealed ? '???' : tie ? `${r.winners.length}-way tie` : w ? w.text : 'No votes'}
        </span>
        <span className="display text-3xl font-extrabold tabular-nums leading-none">
          {revealed ? pct : '??'}
          <span className="text-base text-[var(--muted)]">%</span>
        </span>
      </div>
    </a>
  )
}

function WinnersWall({ results, ready, revealedIds, onReveal }: { results: Result[]; ready: boolean; revealedIds: Set<string>; onReveal: (id: string) => void }) {
  return (
    <section id="winners" className="relative">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 py-20 sm:py-28">
        <h2 className="display font-extrabold leading-[1.05] mb-12 sm:mb-16" style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)' }}>
          The winners 🏆
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <WinnerCard
              key={r.poll.id}
              r={r}
              index={i}
              ready={ready}
              revealed={revealedIds.has(r.poll.id)}
              onReveal={() => onReveal(r.poll.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================================
   FULL BREAKDOWN FOR ONE POLL (locked until its winner is revealed)
   ======================================================================== */
function ResultRow({ option, rank, total, color, isWinner, live }: { option: Option; rank: number; total: number; color: string; isWinner: boolean; live: boolean }) {
  const pct = pctOf(option.votes, total)
  const pctTick = useTicker(live ? pct : 0)
  const votesTick = useTicker(live ? option.votes : 0)

  return (
    <div
      className="relative rounded-2xl border-2 border-[var(--ink)] bg-white p-3 sm:p-4"
      style={{
        boxShadow: isWinner ? `5px 5px 0 ${color}, 5px 5px 0 2px var(--ink)` : '3px 3px 0 var(--ink)',
        animation: live ? `rise 650ms ${rank * 90}ms cubic-bezier(.2,.9,.3,1) both` : undefined,
        opacity: live ? undefined : 0,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative shrink-0 w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] rounded-xl overflow-hidden border-2 border-[var(--ink)]">
          {option.image_url ? (
            <img src={option.image_url} alt={option.text} draggable={false} className="w-full h-full object-cover" />
          ) : (
            <div className="display w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-extrabold" style={{ background: color }}>
              {option.text}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="display inline-block break-words max-w-full px-3 py-0.5 rounded-full border-2 border-[var(--ink)] text-sm sm:text-base font-extrabold leading-tight" style={{ background: color }}>
              {option.text}
            </span>
            {isWinner && (
              <span className="text-xl leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
                👑
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-[var(--muted)] tabular-nums">{plural(votesTick, 'vote')}</p>
        </div>

        <span className="display text-3xl sm:text-5xl font-extrabold tabular-nums leading-none" style={isWinner ? { animation: live ? 'pop 600ms 600ms both' : undefined } : undefined}>
          {pctTick}
          <span className="text-base sm:text-xl text-[var(--muted)]">%</span>
        </span>
      </div>

      <div className="mt-3 h-4 w-full rounded-full bg-[var(--line)] overflow-hidden border border-[var(--ink)]/20">
        <div
          className={`relative h-full rounded-full overflow-hidden ${isWinner ? 'shimmer' : ''}`}
          style={{ width: live ? `${pct}%` : '0%', background: color, transition: 'width 1400ms cubic-bezier(.34,1.56,.64,1)' }}
        >
          <span className="stripes absolute inset-0" />
        </div>
      </div>
    </div>
  )
}

function PollResult({ r, index, ready, revealed, onReveal }: { r: Result; index: number; ready: boolean; revealed: boolean; onReveal: () => void }) {
  const [ref, seen] = useInView<HTMLElement>(0.15)
  const live = ready && seen && revealed
  const color = BAR_COLORS[index % BAR_COLORS.length]
  const words = r.poll.question.split(' ')
  const winnerIds = new Set(r.winners.map((w) => w.id))
  const totalTick = useTicker(live ? r.total : 0)
  const colorOf = (id: string) => BAR_COLORS[r.options.findIndex((o) => o.id === id) % BAR_COLORS.length]

  return (
    <section ref={ref} id={`poll-${r.poll.id}`} className="relative scroll-mt-4 border-b-2 border-[var(--ink)]/10">
      <div className="max-w-4xl mx-auto px-5 sm:px-10 py-20 sm:py-28">
        <div className="flex flex-col gap-5 mb-10 sm:mb-14">
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white pl-3 pr-4 py-1.5 shadow-[3px_3px_0_var(--ink)]"
            style={{ animation: seen ? 'rise 600ms both' : undefined, opacity: seen ? undefined : 0 }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c5cff]" />
            <span className="text-sm font-bold tabular-nums">{revealed ? `${plural(totalTick, 'vote')} · final` : 'Results hidden'}</span>
          </div>

          <h2 className="display font-extrabold leading-[1.05]" style={{ fontSize: 'clamp(2rem, 5.2vw, 3.6rem)' }}>
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] mr-[0.26em]">
                <span
                  className="inline-block"
                  style={{ transform: seen ? undefined : 'translateY(120%)', animation: seen ? `word 800ms ${i * 80}ms cubic-bezier(.2,.9,.3,1) both` : undefined }}
                >
                  {w}
                </span>
              </span>
            ))}
          </h2>

          <svg viewBox="0 0 200 14" className="w-40 sm:w-56 -mt-2" fill="none" aria-hidden>
            <path
              d="M2 8 Q 14 0 26 8 T 50 8 T 74 8 T 98 8 T 122 8 T 146 8 T 170 8 T 198 8"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="420"
              strokeDashoffset="420"
              style={{ animation: seen ? 'draw 1.2s 0.5s ease-out forwards' : undefined }}
            />
          </svg>
        </div>

        {!revealed ? (
          <div
            className="stripes rounded-2xl border-2 border-[var(--ink)] p-8 sm:p-12 flex flex-col items-center justify-center gap-5 text-center"
            style={{ background: color, boxShadow: '5px 5px 0 var(--ink)' }}
          >
            <span className="text-6xl leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
              🔒
            </span>
            <p className="display text-xl sm:text-2xl font-extrabold bg-white border-2 border-[var(--ink)] rounded-full px-5 py-1.5 shadow-[3px_3px_0_var(--ink)]">
              Results are hidden
            </p>
            <button
              type="button"
              onClick={onReveal}
              className="display rounded-full border-2 border-[var(--ink)] bg-[var(--ink)] px-7 py-3 text-lg sm:text-xl font-extrabold text-white outline-none transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#7c5cff]"
            >
              Reveal results 🎁
            </button>
          </div>
        ) : r.total === 0 ? (
          <p className="display text-2xl font-extrabold">No votes were cast for this poll.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5">
            {r.options.map((o, i) => (
              <ResultRow key={o.id} option={o} rank={i} total={r.total} color={colorOf(o.id)} isWinner={winnerIds.has(o.id)} live={live} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ========================================================================
   PAGE
   ======================================================================== */
export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [splashGone, setSplashGone] = useState(false)
  // Poll ids whose winner has been revealed (unlocks both the card and its full breakdown)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const ready = splashGone
  const handleSplashDone = useCallback(() => setSplashGone(true), [])
  const handleReveal = useCallback((id: string) => {
    setRevealedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  // Browser tab title + emoji icon
  useEffect(() => {
    document.title = TAB_TITLE
    const href = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${TAB_EMOJI}</text></svg>`
    )}`
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = href
  }, [])

  // Final tally: read once from the database (voting is closed, so no realtime needed)
  useEffect(() => {
    async function fetchData() {
      const [p, o] = await Promise.all([supabase.from('polls').select('*'), supabase.from('options').select('*')])
      if (p.error || o.error) setError(true)
      if (p.data) setPolls(p.data)
      if (o.data) setOptions(o.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const results: Result[] = polls.map((poll) => {
    const opts = byVotes(options.filter((o) => o.poll_id === poll.id))
    const max = opts.length ? opts[0].votes : 0
    return {
      poll,
      options: opts,
      total: opts.reduce((a, o) => a + o.votes, 0),
      winners: max > 0 ? opts.filter((o) => o.votes === max) : [],
    }
  })

  return (
    <main className="vote-root min-h-screen relative">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {!splashGone && <Splash loading={loading} onDone={handleSplashDone} />}

      <Backdrop />
      <ScrollBar />
      <Shower on={ready} />

      <div className="relative z-10">
        <BrandChip />

        <Hero ready={ready} />

        {!loading && error && (
          <div className="min-h-[50vh] flex items-center justify-center p-10">
            <p className="display text-2xl sm:text-4xl text-center font-extrabold">Couldn’t load the results. Refresh to try again.</p>
          </div>
        )}

        {!loading && !error && polls.length === 0 && (
          <div className="min-h-[50vh] flex items-center justify-center p-10">
            <p className="display text-3xl sm:text-5xl text-center font-extrabold">No results yet ✨</p>
          </div>
        )}

        {results.length > 0 && <WinnersWall results={results} ready={ready} revealedIds={revealedIds} onReveal={handleReveal} />}

        {results.map((r, i) => (
          <PollResult
            key={r.poll.id}
            r={r}
            index={i}
            ready={ready}
            revealed={revealedIds.has(r.poll.id)}
            onReveal={() => handleReveal(r.poll.id)}
          />
        ))}

                {results.length > 0 && (
          <footer className="max-w-4xl mx-auto px-5 sm:px-10 py-20 text-center">
            <p className="display text-2xl sm:text-4xl font-extrabold">{FOOTER_TEXT}</p>
          </footer>
        )}

        {/* Watermark: always the very last thing on the page */}
        <div className="border-t-2 border-[var(--ink)]/10 px-5 py-6 text-center">
          <p className="display text-sm font-bold tracking-wide text-[var(--muted)]">
            A product of <span className="text-[var(--ink)]">Siehz</span>.
		By Jes.
          </p>
        </div>
      </div>
    </main>
  )
}