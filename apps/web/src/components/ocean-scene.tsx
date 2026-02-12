'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Reusable inline SVG pieces for the kawaii ocean / lobster theme    */
/* ------------------------------------------------------------------ */

/** Floating bubble particles — purely decorative */
export function OceanBubbles({ count = 20, className }: { count?: number; className?: string }) {
  // Deterministic pseudo-random to avoid SSR/client hydration mismatch
  // Uses mulberry32 (integer-only arithmetic) so results are identical across
  // Node.js and every browser — Math.sin()-based PRNGs drift due to
  // floating-point implementation differences.
  const bubbles = React.useMemo(() => {
    function mulberry32(seed: number) {
      return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
    }
    const rand = mulberry32(42)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      cx: rand() * 100,
      cy: rand() * 100,
      r: 2 + rand() * 6,
      delay: rand() * 8,
      dur: 6 + rand() * 8,
    }))
  }, [count])

  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <radialGradient id="bub" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      {bubbles.map((b) => (
        <circle
          key={b.id}
          cx={b.cx}
          cy={b.cy}
          r={b.r * 0.15}
          fill="url(#bub)"
          className="ocean-bubble"
          style={
            {
              '--bubble-delay': `${b.delay}s`,
              '--bubble-dur': `${b.dur}s`,
              '--bubble-x': `${b.cx}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  )
}

/** Light rays shining from above */
export function OceanRays({ className }: { className?: string }) {
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]', className)}
      viewBox="0 0 1500 500"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points="300,0 370,500 230,500" fill="#fff" />
      <polygon points="600,0 680,500 520,500" fill="#fff" />
      <polygon points="900,0 970,500 830,500" fill="#fff" />
      <polygon points="1200,0 1280,500 1120,500" fill="#fff" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Kawaii Lobster — self-contained SVG component                      */
/* ------------------------------------------------------------------ */
interface LobsterProps {
  className?: string
  /** scale factor (default 1) */
  size?: number
  /** which expression */
  expression?: 'happy' | 'wink' | 'star' | 'blush'
  /** Is the lobster waving a claw? */
  waving?: boolean
  /** Is the lobster holding a phone? */
  holdingPhone?: boolean
  /** flip horizontally */
  flip?: boolean
  style?: React.CSSProperties
}

export function KawaiiLobster({
  className,
  size = 1,
  expression = 'happy',
  waving = false,
  holdingPhone = false,
  flip = false,
  style,
}: LobsterProps) {
  const w = 80 * size
  const h = 90 * size
  return (
    <svg
      className={cn('pointer-events-none', className)}
      width={w}
      height={h}
      viewBox="-45 -55 90 110"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, ...style }}
      aria-hidden
    >
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="lbl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* tail */}
      <ellipse cx="0" cy="42" rx="13" ry="7" fill="#dc2626" opacity="0.7" />
      {/* body */}
      <ellipse cx="0" cy="12" rx="26" ry="24" fill="url(#lb)" />
      <ellipse cx="0" cy="16" rx="15" ry="12" fill="#f87171" opacity="0.3" />

      {/* eyes */}
      {expression === 'star' ? (
        <>
          <circle cx="-8" cy="-1" r="5" fill="#fff" />
          <circle cx="8" cy="-1" r="5" fill="#fff" />
          <text x="-11" y="3" fontSize="8" fill="#1e293b">
            ★
          </text>
          <text x="5" y="3" fontSize="8" fill="#1e293b">
            ★
          </text>
        </>
      ) : expression === 'wink' ? (
        <>
          <circle cx="-8" cy="0" r="5.5" fill="#fff" />
          <circle cx="-6" cy="-1" r="3" fill="#1e293b" />
          <circle cx="-5" cy="-2" r="1" fill="#fff" />
          <path
            d="M4,2 Q7,-2 10,2"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="-8" cy="0" r="5.5" fill="#fff" />
          <circle cx="8" cy="0" r="5.5" fill="#fff" />
          <circle cx="-6" cy="-1" r="3" fill="#1e293b" />
          <circle cx="10" cy="-1" r="3" fill="#1e293b" />
          <circle cx="-5" cy="-2" r="1" fill="#fff" />
          <circle cx="11" cy="-2" r="1" fill="#fff" />
        </>
      )}

      {/* smile */}
      <path
        d="M-5,9 Q0,15 5,9"
        fill="none"
        stroke="#991b1b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {expression === 'star' && (
        <ellipse cx="0" cy="12" rx="4" ry="3" fill="#991b1b" opacity="0.4" />
      )}

      {/* blush */}
      <ellipse cx="-14" cy="9" rx="4.5" ry="2.8" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="14" cy="9" rx="4.5" ry="2.8" fill="#fca5a5" opacity="0.5" />

      {/* antennae */}
      <path
        d="M-4,-13 Q-18,-35 -25,-45"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4,-13 Q18,-35 25,-45"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="-25" cy="-45" r="2.5" fill="#f87171" />
      <circle cx="25" cy="-45" r="2.5" fill="#f87171" />

      {/* claws */}
      {waving ? (
        <>
          <g transform="translate(-28,-10) rotate(-30)">
            <path d="M0,0 L-10,-6 L-15,-1 L-6,3 Z" fill="url(#lbl)" />
            <path d="M0,0 L-10,5 L-15,1 L-6,-2 Z" fill="url(#lb)" />
          </g>
          <g transform="translate(28,8)">
            <path d="M0,0 L10,-5 L15,0 L7,3 Z" fill="url(#lbl)" />
            <path d="M0,0 L10,5 L15,1 L7,-2 Z" fill="url(#lb)" />
          </g>
        </>
      ) : holdingPhone ? (
        <>
          <g transform="translate(-28,5)">
            <path d="M0,0 L-8,-4 L-12,0 L-5,3 Z" fill="url(#lbl)" />
            <path d="M0,0 L-8,4 L-12,1 L-5,-1 Z" fill="url(#lb)" />
            <rect x="-24" y="-12" width="13" height="20" rx="2.5" fill="#334155" />
            <rect x="-23" y="-9" width="11" height="15" rx="1" fill="#60a5fa" />
            <path
              d="M-20,-4 L-18,3 L-15,-4"
              fill="none"
              stroke="#fff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(28,5)">
            <path d="M0,0 L8,-4 L12,0 L5,3 Z" fill="url(#lbl)" />
            <path d="M0,0 L8,4 L12,1 L5,-1 Z" fill="url(#lb)" />
          </g>
        </>
      ) : (
        <>
          <g transform="translate(-28,5)">
            <path d="M0,0 L-10,-5 L-14,0 L-6,4 Z" fill="url(#lbl)" />
            <path d="M0,0 L-10,5 L-14,1 L-6,-2 Z" fill="url(#lb)" />
          </g>
          <g transform="translate(28,5)">
            <path d="M0,0 L10,-5 L14,0 L6,4 Z" fill="url(#lbl)" />
            <path d="M0,0 L10,5 L14,1 L6,-2 Z" fill="url(#lb)" />
          </g>
        </>
      )}

      {/* legs */}
      <line
        x1="-16"
        y1="28"
        x2="-24"
        y2="38"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="28"
        x2="24"
        y2="38"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Coral reef strip — bottom decoration                               */
/* ------------------------------------------------------------------ */
export function CoralReef({ className }: { className?: string }) {
  return (
    <svg
      className={cn('pointer-events-none absolute bottom-0 left-0 w-full', className)}
      viewBox="0 0 1500 120"
      preserveAspectRatio="none"
      style={{ height: '120px' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="cr1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="cr2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="cr3" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="sw" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* seaweed */}
      <g transform="translate(60,120)" opacity="0.7">
        <path
          d="M0,0 Q-12,-40 4,-70 Q18,-95 0,-120"
          fill="none"
          stroke="url(#sw)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(1440,120)" opacity="0.7">
        <path
          d="M0,0 Q12,-35 -4,-65 Q-18,-90 0,-115"
          fill="none"
          stroke="url(#sw)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* coral clusters */}
      <g transform="translate(120,100)">
        <ellipse cx="0" cy="0" rx="18" ry="32" fill="url(#cr1)" opacity="0.8" />
        <ellipse cx="20" cy="4" rx="14" ry="26" fill="url(#cr1)" opacity="0.6" />
      </g>
      <g transform="translate(350,105)">
        <rect x="-3" y="-35" width="6" height="35" rx="3" fill="url(#cr2)" />
        <circle cx="0" cy="-35" r="6" fill="url(#cr2)" />
        <rect x="10" y="-25" width="5" height="25" rx="2" fill="url(#cr2)" opacity="0.7" />
        <circle cx="12" cy="-25" r="4" fill="url(#cr2)" opacity="0.8" />
      </g>
      <g transform="translate(600,108)">
        <ellipse cx="0" cy="0" rx="22" ry="14" fill="url(#cr3)" opacity="0.6" />
      </g>
      <g transform="translate(900,105)">
        <ellipse cx="0" cy="0" rx="16" ry="28" fill="url(#cr1)" opacity="0.7" />
        <ellipse cx="18" cy="4" rx="12" ry="22" fill="url(#cr3)" opacity="0.5" />
      </g>
      <g transform="translate(1150,108)">
        <rect x="-3" y="-30" width="6" height="30" rx="3" fill="url(#cr2)" />
        <circle cx="0" cy="-30" r="5" fill="url(#cr2)" />
      </g>
      <g transform="translate(1350,100)">
        <ellipse cx="0" cy="0" rx="16" ry="30" fill="url(#cr1)" opacity="0.7" />
        <ellipse cx="-16" cy="6" rx="12" ry="22" fill="url(#cr2)" opacity="0.6" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Chain links — decorative dashed lines connecting items             */
/* ------------------------------------------------------------------ */
export function ChainLinks({ className }: { className?: string }) {
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g opacity="0.1" stroke="#fff" strokeWidth="1.5" fill="none">
        <path d="M100,200 Q300,100 500,200" strokeDasharray="4,8" />
        <path d="M500,200 Q700,300 900,200" strokeDasharray="4,8" />
        <path d="M900,200 Q1100,100 1200,200" strokeDasharray="4,8" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Complete ocean scene backdrop (hero or CTA)                        */
/* ------------------------------------------------------------------ */
interface OceanSceneProps {
  children?: React.ReactNode
  className?: string
  /** 'deep' = darker gradient for CTA, 'light' = lighter for hero */
  variant?: 'light' | 'deep'
  showCorals?: boolean
  showLobsters?: boolean
  lobsterCount?: number
}

export function OceanScene({
  children,
  className,
  variant = 'light',
  showCorals = true,
  showLobsters = true,
}: OceanSceneProps) {
  const gradientClass =
    variant === 'deep'
      ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900'
      : 'bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700'

  return (
    <div className={cn('relative overflow-hidden', gradientClass, className)}>
      <OceanBubbles count={24} className="opacity-60" />
      {showCorals && <CoralReef />}
      {showLobsters && (
        <>
          {/* scattered lobsters at edges */}
          <div
            className="pointer-events-none absolute bottom-8 left-[5%] ocean-float"
            style={{ '--float-delay': '0s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.8} expression="happy" waving />
          </div>
          <div
            className="pointer-events-none absolute bottom-12 right-[6%] ocean-float"
            style={{ '--float-delay': '1.5s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.7} expression="star" flip />
          </div>
          <div
            className="pointer-events-none absolute bottom-16 left-[22%] ocean-float opacity-60"
            style={{ '--float-delay': '3s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.5} expression="wink" />
          </div>
          <div
            className="pointer-events-none absolute bottom-10 right-[20%] ocean-float opacity-70"
            style={{ '--float-delay': '2s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.55} expression="blush" holdingPhone flip />
          </div>
          {/* tiny background lobsters */}
          <div
            className="pointer-events-none absolute top-[25%] left-[8%] ocean-float opacity-30"
            style={{ '--float-delay': '4s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.35} expression="happy" />
          </div>
          <div
            className="pointer-events-none absolute top-[20%] right-[10%] ocean-float opacity-25"
            style={{ '--float-delay': '5s' } as React.CSSProperties}
          >
            <KawaiiLobster size={0.3} expression="wink" flip />
          </div>
        </>
      )}
      {/* content goes on top */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Speech bubble decorator                                            */
/* ------------------------------------------------------------------ */
export function SpeechBubble({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative inline-block rounded-2xl bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow-lg',
        'after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white/90',
        className
      )}
    >
      {children}
    </div>
  )
}
