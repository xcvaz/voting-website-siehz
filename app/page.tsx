'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react'
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
const BRAND = 'vibe vote' // shown in splash + top-left chip
const BAR_COLORS = ['#ff6b9d', '#7c5cff', '#ffb020', '#19c3a0', '#3b9cff', '#ff7a45']
const BURST_EMOJI = ['✨', '💖', '🔥', '⭐', '🎉']
const SPLASH_MESSAGES = ['warming up the votes', 'stacking the bars', 'sprinkling sparkle', 'almost there']
const TOASTS = ['vote locked in ✨', 'bold pick 🔥', 'noted 💖', 'the people have spoken 🎉']
const SHAPES = [
  { c: '✦', x: '6%', y: '16%', s: 44, d: 90, t: 9 },
  { c: '✿', x: '90%', y: '10%', s: 58, d: -120, t: 11 },
  { c: '◯', x: '12%', y: '60%', s: 64, d: 70, t: 8 },
  { c: '✚', x: '86%', y: '46%', s: 40, d: -80, t: 10 },
  { c: '☺', x: '70%', y: '84%', s: 52, d: 110, t: 12 },
  { c: '▲', x: '30%', y: '90%', s: 34, d: -60, t: 7 },
  { c: '✷', x: '48%', y: '6%', s: 38, d: 80, t: 9 },
  { c: '◆', x: '96%', y: '72%', s: 30, d: -100, t: 8 },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.vote-root {
  --ink: #15132b; --muted: #6b6a80; --paper: #f7f7fc; --line: #e3e2f0;
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  color: var(--ink);
  background-color: var(--paper);
  background-image: radial-gradient(rgba(21,19,43,.07) 1px, transparent 1px);
  background-size: 22px 22px;
}
.display { font-family: 'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; }

.stripes {
  background-image: linear-gradient(135deg, rgba(255,255,255,.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.28) 75%, transparent 75%);
  background-size: 28px 28px;
  animation: march 1.4s linear infinite;
}
.shimmer::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
  transform: translateX(-100%); animation: sweep 2.2s ease-in-out infinite;
}
.grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>");
  mix-blend-mode: multiply; opacity: .12;
}

@keyframes rise     { from { transform: translateY(46px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes word     { from { transform: translateY(120%) rotate(5deg) } to { transform: none } }
@keyframes pop      { 0% { transform: scale(1) } 35% { transform: scale(1.18) } 100% { transform: scale(1) } }
@keyframes bob      { 0%,100% { transform: translateY(0) rotate(-8deg) } 50% { transform: translateY(-7px) rotate(8deg) } }
@keyframes live     { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .3; transform: scale(.6) } }
@keyframes burst    { 0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) scale(.2) rotate(240deg); opacity: 0 } }
@keyframes march    { to { background-position: 28px 0 } }
@keyframes sweep    { to { transform: translateX(100%) } }
@keyframes idle     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes drift    { 0%,100% { transform: translate(0,0) rotate(0deg) } 33% { transform: translate(18px,-26px) rotate(14deg) } 66% { transform: translate(-16px,-10px) rotate(-12deg) } }
@keyframes aurora1  { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(14vw,10vh) scale(1.25) } }
@keyframes aurora2  { 0%,100% { transform: translate(0,0) scale(1.1) } 50% { transform: translate(-16vw,-8vh) scale(.9) } }
@keyframes aurora3  { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(8vw,-14vh) scale(1.3) } }
@keyframes ring     { from { transform: translate(-50%,-50%) scale(.2); opacity: .8 } to { transform: translate(-50%,-50%) scale(5); opacity: 0 } }
@keyframes plus     { 0% { transform: translate(-50%,0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(-50%,-70px) scale(1.2); opacity: 0 } }
@keyframes toastIn  { from { transform: translate(-50%,40px) scale(.9); opacity: 0 } to { transform: translate(-50%,0) scale(1); opacity: 1 } }
@keyframes draw     { from { stroke-dashoffset: 420 } to { stroke-dashoffset: 0 } }
@keyframes spin     { to { transform: rotate(360deg) } }
@keyframes loadbar  { 0%,100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
@keyframes stripOut { 0% { transform: translateY(0); background-color: #f7f7fc } 25% { background-color: var(--c) } 100% { transform: translateY(-101%); background-color: var(--c) } }
@keyframes contentOut { to { opacity: 0; transform: scale(.92) translateY(-20px) } }
@keyframes splashFloat { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-22px) rotate(8deg) } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`

/* ========================================================================
   HELPERS + HOOKS
   ======================================================================== */
const sortOptions = (arr: Option[]) =>
  [...arr].sort((a, b) => a.text.localeCompare(b.text, undefined, { numeric: true, sensitivity: 'base' }))

// Smooth count-up / count-down
function useTicker(target: number, duration = 900) {
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

// Confetti burst on vote
function useBursts() {
  const [bursts, setBursts] = useState<number[]>([])
  const fire = () => {
    const id = Date.now() + Math.random()
    setBursts((b) => [...b, id])
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1000)
  }
  return { bursts, fire }
}

// Flies a "+1" / "-1" whenever the vote count changes (also from other people's votes)
function useDeltas(votes: number, enabled: boolean) {
  const prev = useRef(votes)
  const [items, setItems] = useState<{ id: number; d: number }[]>([])
  useEffect(() => {
    const d = votes - prev.current
    prev.current = votes
    if (!enabled || d === 0) return
    const id = Math.random()
    setItems((i) => [...i, { id, d }])
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 1100)
  }, [votes, enabled])
  return items
}

// Becomes true the first time the element scrolls into view
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

function Bursts({ ids, color, className }: { ids: number[]; color: string; className: string }) {
  return (
    <>
      {ids.map((id) => (
        <div key={id} className={`pointer-events-none absolute w-0 h-0 z-20 ${className}`}>
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2
            const dist = 80 + (i % 3) * 45
            const style = {
              '--dx': `${Math.cos(angle) * dist}px`,
              '--dy': `${Math.sin(angle) * dist - 30}px`,
              animation: 'burst 900ms cubic-bezier(.2,.8,.3,1) forwards',
            } as CSSProperties
            return i % 2 ? (
              <span key={i} className="absolute -left-3 -top-3 text-xl" style={style}>
                {BURST_EMOJI[i % BURST_EMOJI.length]}
              </span>
            ) : (
              <span
                key={i}
                className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full"
                style={{ ...style, background: i % 4 ? '#fff' : color, border: '2px solid var(--ink)' }}
              />
            )
          })}
        </div>
      ))}
    </>
  )
}

function Deltas({ items }: { items: { id: number; d: number }[] }) {
  return (
    <>
      {items.map((x) => (
        <span
          key={x.id}
          className="display pointer-events-none absolute left-1/2 top-0 z-30 text-xl font-extrabold"
          style={{ color: x.d > 0 ? '#19c3a0' : '#ff6b9d', animation: 'plus 1100ms ease-out forwards' }}
        >
          {x.d > 0 ? `+${x.d}` : x.d}
        </span>
      ))}
    </>
  )
}

/* ========================================================================
   SPLASH / LOADING SCREEN
   Counts 0 → 100 (waits at 92 until data is loaded), then colored strips
   wipe upward to reveal the page.
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
      {/* curtain strips */}
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

      {/* floating emoji */}
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

        {/* equalizer bars that fill with progress */}
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
   BACKDROP: aurora blobs, parallax shapes, cursor glow, click ripples
   (all driven by CSS variables set from one rAF loop, no re-render per frame)
   ======================================================================== */
function Backdrop() {
  const root = useRef<HTMLDivElement>(null)
  const [rings, setRings] = useState<{ id: number; x: number; y: number; c: string }[]>([])

  useEffect(() => {
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx
    let cy = ty
    let raf = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const onDown = (e: PointerEvent) => {
      const id = Math.random()
      const c = BAR_COLORS[Math.floor(Math.random() * BAR_COLORS.length)]
      setRings((r) => [...r, { id, x: e.clientX, y: e.clientY, c }])
      setTimeout(() => setRings((r) => r.filter((x) => x.id !== id)), 800)
    }
    const loop = () => {
      cx += (tx - cx) * 0.1
      cy += (ty - cy) * 0.1
      const el = root.current
      if (el) {
        el.style.setProperty('--cx', `${cx}px`)
        el.style.setProperty('--cy', `${cy}px`)
        el.style.setProperty('--mx', (cx / window.innerWidth - 0.5).toFixed(3))
        el.style.setProperty('--my', (cy / window.innerHeight - 0.5).toFixed(3))
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      cancelAnimationFrame(raf)
    }
  }, [])

  const blob = (color: string, pos: string, anim: string): CSSProperties => ({
    background: color,
    animation: `${anim} 22s ease-in-out infinite`,
    ...(Object.fromEntries(pos.split(';').map((p) => p.split(':'))) as CSSProperties),
  })

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* aurora */}
      <div className="absolute w-[55vw] h-[55vw] rounded-full blur-[110px] opacity-40" style={blob('#ff6b9d', 'left:-10vw;top:-10vw', 'aurora1')} />
      <div className="absolute w-[50vw] h-[50vw] rounded-full blur-[110px] opacity-35" style={blob('#7c5cff', 'right:-12vw;top:20vh', 'aurora2')} />
      <div className="absolute w-[45vw] h-[45vw] rounded-full blur-[110px] opacity-35" style={blob('#19c3a0', 'left:20vw;bottom:-15vw', 'aurora3')} />

      {/* parallax floating shapes */}
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className="absolute leading-none opacity-40"
          style={{
            left: s.x,
            top: s.y,
            fontSize: s.s,
            color: BAR_COLORS[i % BAR_COLORS.length],
            transform: `translate3d(calc(var(--mx, 0) * ${s.d}px), calc(var(--my, 0) * ${s.d}px), 0)`,
          }}
        >
          <span className="block" style={{ animation: `drift ${s.t}s ease-in-out ${i * -1.1}s infinite` }}>
            {s.c}
          </span>
        </span>
      ))}

      {/* cursor glow (mouse devices only) */}
      <div
        className="hidden [@media(pointer:fine)]:block absolute left-0 top-0 w-[480px] h-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,92,255,.22), rgba(255,107,157,.1) 45%, transparent 70%)',
          transform: 'translate(calc(var(--cx, 50vw) - 50%), calc(var(--cy, 50vh) - 50%))',
        }}
      />

      {/* click ripples */}
      {rings.map((r) => (
        <span
          key={r.id}
          className="absolute w-16 h-16 rounded-full"
          style={{ left: r.x, top: r.y, border: `3px solid ${r.c}`, animation: 'ring 800ms ease-out forwards' }}
        />
      ))}

      <div className="grain absolute inset-0" />
    </div>
  )
}

/* ========================================================================
   SMALL UI: scroll progress, brand chip, toast, poll dots
   ======================================================================== */
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
    <div className="fixed top-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white/80 backdrop-blur px-3.5 py-1.5 shadow-[3px_3px_0_var(--ink)]">
      <span className="relative w-3.5 h-3.5 rounded-full bg-[#7c5cff]">
        <span className="absolute inset-0 rounded-full bg-[#7c5cff]" style={{ animation: 'ring 1.8s ease-out infinite' }} />
      </span>
      <span className="display font-extrabold text-sm">{BRAND}</span>
    </div>
  )
}

function Toast({ toast }: { toast: { id: number; msg: string } | null }) {
  if (!toast) return null
  return (
    <div
      key={toast.id}
      role="status"
      className="display fixed bottom-6 left-1/2 z-50 rounded-full border-2 border-[var(--ink)] bg-white px-5 py-2.5 text-sm sm:text-base font-extrabold shadow-[4px_4px_0_var(--ink)]"
      style={{ animation: 'toastIn 350ms cubic-bezier(.34,1.56,.64,1) both' }}
    >
      {toast.msg}
    </div>
  )
}

function PollDots({ polls, active }: { polls: Poll[]; active: number }) {
  if (polls.length < 2) return null
  return (
    <nav aria-label="Polls" className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
      {polls.map((p, i) => (
        <button
          key={p.id}
          aria-label={`Go to poll ${i + 1}`}
          onClick={() => document.getElementById(`poll-${p.id}`)?.scrollIntoView({ behavior: 'smooth' })}
          className="w-4 h-4 rounded-full border-2 border-[var(--ink)] transition-all duration-300 hover:scale-125"
          style={{
            background: i === active ? BAR_COLORS[i % BAR_COLORS.length] : '#fff',
            transform: i === active ? 'scale(1.4)' : undefined,
          }}
        />
      ))}
    </nav>
  )
}

/* ========================================================================
   DESKTOP: ONE OPTION COLUMN
   ======================================================================== */
interface ItemProps {
  option: Option
  index: number
  color: string
  percentage: number
  ratio: number
  isLeader: boolean
  isSelected: boolean
  ready: boolean
  onVote: () => void
}

function OptionColumn({ option, index, color, percentage, ratio, isLeader, isSelected, ready, onVote }: ItemProps) {
  const pctTick = useTicker(ready ? percentage : 0)
  const votesTick = useTicker(ready ? option.votes : 0)
  const deltas = useDeltas(option.votes, ready)
  const { bursts, fire } = useBursts()
  const tiltRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (!isSelected) fire()
    onVote()
  }

  const handleMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(1)}deg`)
    el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1)}deg`)
  }
  const handleLeave = () => {
    tiltRef.current?.style.setProperty('--rx', '0deg')
    tiltRef.current?.style.setProperty('--ry', '0deg')
  }

  const frac = ready ? 0.03 + ratio * 0.22 : 0
  const shortLabel = option.text.length <= 2

  return (
    <div
      className="flex flex-col items-center flex-1 min-w-0 max-w-[250px] h-full"
      style={{ animation: ready ? `rise 800ms ${index * 120}ms cubic-bezier(.2,.9,.3,1) both` : undefined, opacity: ready ? undefined : 0 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Vote for ${option.text}`}
        onClick={handleClick}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        className="group relative flex-1 w-full flex flex-col justify-end items-center cursor-pointer select-none outline-none active:scale-[0.96] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#15132b] rounded-[1.75rem]"
      >
        {/* PERCENT + VOTES */}
        <div className="relative text-center mb-5">
          <Deltas items={deltas} />
          {isLeader && (
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 text-3xl leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
              👑
            </div>
          )}
          <div key={option.votes} style={{ animation: 'pop 450ms ease-out' }}>
            <span
              className="display block tabular-nums leading-none font-extrabold"
              style={{
                fontSize: isLeader ? 'clamp(3rem, 5vw, 4.5rem)' : 'clamp(2.2rem, 3.6vw, 3.2rem)',
                transition: 'font-size 500ms cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              {pctTick}
              <span className="text-[0.45em] ml-0.5 text-[var(--muted)]">%</span>
            </span>
          </div>
          <span className="block mt-2 text-sm font-medium tabular-nums text-[var(--muted)]">
            {votesTick} {option.votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        {/* CARD (scale → idle float → 3D tilt) */}
        <div
          className="w-full"
          style={{
            transform: isLeader ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'bottom center',
            transition: 'transform 600ms cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <div style={{ animation: `idle ${5 + (index % 3)}s ease-in-out ${index * -0.9}s infinite` }}>
            <div
              ref={tiltRef}
              className="relative w-full overflow-hidden rounded-[1.5rem] border-2 border-[var(--ink)] bg-white"
              style={{
                transform: 'perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
                transition: 'transform 250ms ease-out, box-shadow 300ms',
                boxShadow: isSelected ? `7px 7px 0 ${color}, 7px 7px 0 2px var(--ink)` : '4px 4px 0 var(--ink)',
              }}
            >
              <div className="relative aspect-square w-full overflow-hidden border-b-2 border-[var(--ink)]">
                {option.image_url ? (
                  <img
                    src={option.image_url}
                    alt={`Option ${option.text}`}
                    draggable={false}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="display w-full h-full flex items-center justify-center font-extrabold"
                    style={{ background: color, fontSize: 'clamp(3rem, 7vw, 6rem)' }}
                  >
                    {option.text}
                  </div>
                )}
                {/* shine sweep on hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isSelected && (
                  <span
                    className="absolute top-3 left-3 bg-white text-xs font-bold px-3 py-1 rounded-full border-2 border-[var(--ink)]"
                    style={{ animation: 'pop 500ms ease-out' }}
                  >
                    your pick ✓
                  </span>
                )}
              </div>

              <div
                className="relative w-full overflow-hidden"
                style={{ background: color, height: `calc(var(--H) * ${frac})`, transition: 'height 1200ms cubic-bezier(.34,1.56,.64,1)' }}
              >
                <span className="stripes absolute inset-0" />
              </div>
            </div>
          </div>
        </div>

        <Bursts ids={bursts} color={color} className="left-1/2 bottom-[40%]" />
      </div>

      {/* BASELINE + LABEL */}
      <div className="w-full">
        <div className="h-[3px] w-full rounded-full bg-[var(--ink)]" />
        <div className="mt-6 flex justify-center">
          <span
            className="display inline-block text-center leading-tight font-extrabold rounded-full border-2 border-[var(--ink)] px-5 py-2 max-w-full break-words"
            style={{
              background: color,
              fontSize: shortLabel ? 'clamp(1.4rem, 2.6vw, 2.2rem)' : 'clamp(0.9rem, 1.3vw, 1.15rem)',
              boxShadow: '3px 3px 0 var(--ink)',
              transform: `rotate(${index % 2 ? 2 : -2}deg) scale(${isLeader ? 1.1 : 1})`,
              transition: 'transform 400ms cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            {option.text}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================
   PHONE: ONE OPTION ROW
   ======================================================================== */
function OptionRow({ option, index, color, percentage, isLeader, isSelected, ready, onVote }: ItemProps) {
  const pctTick = useTicker(ready ? percentage : 0)
  const deltas = useDeltas(option.votes, ready)
  const { bursts, fire } = useBursts()

  const handleClick = () => {
    if (!isSelected) fire()
    onVote()
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`Vote for ${option.text}`}
      onClick={handleClick}
      className="relative w-full text-left rounded-2xl border-2 border-[var(--ink)] bg-white p-3 active:scale-[0.97] transition-[transform,box-shadow] duration-150 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15132b]"
      style={{
        boxShadow: isSelected ? `5px 5px 0 ${color}, 5px 5px 0 2px var(--ink)` : isLeader ? `4px 4px 0 ${color}` : '3px 3px 0 var(--ink)',
        animation: ready ? `rise 650ms ${index * 90}ms cubic-bezier(.2,.9,.3,1) both` : undefined,
        opacity: ready ? undefined : 0,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 border-[var(--ink)]">
          {option.image_url ? (
            <img src={option.image_url} alt={`Option ${option.text}`} draggable={false} className="w-full h-full object-cover" />
          ) : (
            <div className="display w-full h-full flex items-center justify-center text-3xl font-extrabold" style={{ background: color }}>
              {option.text}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="display inline-block px-2.5 py-0.5 rounded-full border-2 border-[var(--ink)] text-sm font-extrabold leading-tight break-words max-w-full"
              style={{ background: color }}
            >
              {option.text}
            </span>
            {isLeader && (
              <span className="text-lg leading-none" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>
                👑
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs font-medium text-[var(--muted)] tabular-nums">
            {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
            {isSelected && <span className="text-[var(--ink)] font-bold"> · your pick ✓</span>}
          </p>
        </div>

        <span className="relative">
          <Deltas items={deltas} />
          <span key={option.votes} className="display block text-3xl font-extrabold tabular-nums leading-none" style={{ animation: 'pop 450ms ease-out' }}>
            {pctTick}
            <span className="text-base text-[var(--muted)]">%</span>
          </span>
        </span>
      </div>

      <div className="mt-3 h-3.5 w-full rounded-full bg-[var(--line)] overflow-hidden border border-[var(--ink)]/20">
        <div
          className="shimmer relative h-full rounded-full overflow-hidden"
          style={{ width: ready ? `${percentage}%` : '0%', background: color, transition: 'width 1200ms cubic-bezier(.34,1.56,.64,1)' }}
        />
      </div>

      <Bursts ids={bursts} color={color} className="right-10 top-1/2" />
    </button>
  )
}

/* ========================================================================
   ONE POLL
   ======================================================================== */
interface StageProps {
  poll: Poll
  pollIndex: number
  options: Option[]
  selectedOptionId?: string
  ready: boolean
  onVote: (optionId: string) => void
}

function PollStage({ poll, pollIndex, options, selectedOptionId, ready, onVote }: StageProps) {
  const [ref, seen] = useInView<HTMLElement>(0.15)
  const live = ready && seen // bars + numbers animate in when scrolled into view
  const totalVotes = options.reduce((a, o) => a + o.votes, 0)
  const maxVotes = options.reduce((m, o) => Math.max(m, o.votes), 0)
  const totalTick = useTicker(live ? totalVotes : 0)
  const words = poll.question.split(' ')

  const itemProps = (option: Option, i: number): ItemProps => ({
    option,
    index: i,
    color: BAR_COLORS[i % BAR_COLORS.length],
    percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    ratio: maxVotes > 0 ? option.votes / maxVotes : 0,
    isLeader: maxVotes > 0 && option.votes === maxVotes,
    isSelected: selectedOptionId === option.id,
    ready: live,
    onVote: () => onVote(option.id),
  })

  return (
    <section ref={ref} id={`poll-${poll.id}`} data-poll={pollIndex} className="relative border-b-2 border-[var(--ink)]/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 py-20 sm:py-28">
        <div className="flex flex-col gap-5 mb-10 sm:mb-20 max-w-3xl">
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-white pl-3 pr-4 py-1.5 shadow-[3px_3px_0_var(--ink)]"
            style={{ animation: seen ? 'rise 600ms both' : undefined, opacity: seen ? undefined : 0 }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b9d]" style={{ animation: 'live 1.4s ease-in-out infinite' }} />
            <span className="text-sm font-bold tabular-nums">
              {totalTick} {totalVotes === 1 ? 'vote' : 'votes'} live
            </span>
          </div>

          <h1 className="display font-extrabold leading-[1.05]" style={{ fontSize: 'clamp(2rem, 5.2vw, 4rem)' }}>
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] mr-[0.26em]">
                <span
                  className="inline-block cursor-default transition-transform duration-200 hover:-translate-y-1 hover:-rotate-3 hover:text-[#7c5cff]"
                  style={{ transform: seen ? undefined : 'translateY(120%)', animation: seen ? `word 800ms ${i * 80}ms cubic-bezier(.2,.9,.3,1) both` : undefined }}
                >
                  {w}
                </span>
              </span>
            ))}
          </h1>

          {/* hand-drawn underline that draws itself */}
          <svg viewBox="0 0 200 14" className="w-40 sm:w-56 -mt-2" fill="none" aria-hidden>
            <path
              d="M2 8 Q 14 0 26 8 T 50 8 T 74 8 T 98 8 T 122 8 T 146 8 T 170 8 T 198 8"
              stroke={BAR_COLORS[pollIndex % BAR_COLORS.length]}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="420"
              strokeDashoffset="420"
              style={{ animation: seen ? 'draw 1.2s 0.5s ease-out forwards' : undefined }}
            />
          </svg>
        </div>

        {/* DESKTOP / TABLET */}
        <div
          className="hidden md:flex h-[var(--H)] items-stretch justify-center gap-8 lg:gap-12 pt-16"
          style={{ '--H': 'clamp(560px, 78vh, 720px)' } as CSSProperties}
        >
          {options.map((option, i) => (
            <OptionColumn key={option.id} {...itemProps(option, i)} />
          ))}
        </div>

        {/* PHONE */}
        <div className="md:hidden flex flex-col gap-4">
          {options.map((option, i) => (
            <OptionRow key={option.id} {...itemProps(option, i)} />
          ))}
        </div>
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
  const [splashGone, setSplashGone] = useState(false)
  const [activePoll, setActivePoll] = useState(0)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const ready = splashGone // page animations start once the curtain has lifted
  const handleSplashDone = useCallback(() => setSplashGone(true), [])

  /* 1. FETCH + REALTIME */
  useEffect(() => {
    async function fetchData() {
      const { data: pollsData } = await supabase.from('polls').select('*')
      const { data: optionsData } = await supabase.from('options').select('*')
      if (pollsData) setPolls(pollsData)
      if (optionsData) setOptions(optionsData)
      setLoading(false)
    }
    fetchData()

    const channel = supabase
      .channel('realtime-options')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, (payload) => {
        setOptions((prev) => prev.map((opt) => (opt.id === payload.new.id ? { ...opt, votes: payload.new.votes } : opt)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  /* 2. Track which poll is on screen (for the side dots) */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-poll]'))
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActivePoll(Number((e.target as HTMLElement).dataset.poll))),
      { threshold: 0.5 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [polls.length, splashGone])

  /* 3. Vote / un-vote */
  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), msg })
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }

  const adjustLocal = (optionId: string, delta: number) =>
    setOptions((prev) => prev.map((o) => (o.id === optionId ? { ...o, votes: Math.max(0, o.votes + delta) } : o)))

  const handleVoteToggle = async (pollId: string, optionId: string) => {
    const previousId = userVotes[pollId]
    const current = options.find((o) => o.id === optionId)
    if (!current) return
    navigator.vibrate?.(14) // tiny haptic tap on phones that support it

    if (previousId === optionId) {
      setUserVotes((prev) => {
        const copy = { ...prev }
        delete copy[pollId]
        return copy
      })
      adjustLocal(optionId, -1)
      showToast('vote removed')
      await supabase.from('options').update({ votes: Math.max(0, current.votes - 1) }).eq('id', optionId)
      return
    }

    const jobs: PromiseLike<unknown>[] = []
    if (previousId) {
      const prevOption = options.find((o) => o.id === previousId)
      if (prevOption) {
        adjustLocal(previousId, -1)
        jobs.push(supabase.from('options').update({ votes: Math.max(0, prevOption.votes - 1) }).eq('id', previousId))
      }
    }

    setUserVotes((prev) => ({ ...prev, [pollId]: optionId }))
    adjustLocal(optionId, 1)
    showToast(previousId ? 'switched it up 🔄' : TOASTS[Math.floor(Math.random() * TOASTS.length)])
    jobs.push(supabase.from('options').update({ votes: current.votes + 1 }).eq('id', optionId))
    await Promise.all(jobs)
  }

  /* 4. Render */
  return (
    <main className="vote-root min-h-screen relative">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {!splashGone && <Splash loading={loading} onDone={handleSplashDone} />}

      <Backdrop />
      <ScrollBar />

      <div className="relative z-10">
        <BrandChip />
        <PollDots polls={polls} active={activePoll} />

        {!loading && polls.length === 0 && (
          <div className="min-h-screen flex items-center justify-center p-10">
            <p className="display text-3xl sm:text-5xl text-center font-extrabold">No polls yet. Check back soon ✨</p>
          </div>
        )}

        {polls.map((poll, i) => (
          <PollStage
            key={poll.id}
            poll={poll}
            pollIndex={i}
            options={sortOptions(options.filter((o) => o.poll_id === poll.id))}
            selectedOptionId={userVotes[poll.id]}
            ready={ready}
            onVote={(optionId) => handleVoteToggle(poll.id, optionId)}
          />
        ))}
      </div>

      <Toast toast={toast} />
    </main>
  )
}