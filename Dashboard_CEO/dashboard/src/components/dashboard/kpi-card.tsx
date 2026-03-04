'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent, calculateChange } from '@/lib/format'

const GRADIENTS = [
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #EF4444, #F97316)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
  'linear-gradient(135deg, #8B5CF6, #A855F7)',
]

const SPARKLINE_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6']

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format: 'currency' | 'percent'
  icon: React.ReactNode
  invertColors?: boolean
  index?: number
  sparkData?: number[]
}

/** Tiny inline sparkline SVG */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const w = 80
  const h = 28
  const pad = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2)
      const y = pad + (1 - (v - min) / range) * (h - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ flexShrink: 0, opacity: 0.85 }}
    >
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Animated count-up hook */
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  const animate = useCallback(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [target, duration])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setDisplay(target)
      return
    }
    animate()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, animate])

  return display
}

export function KPICard({
  title,
  value,
  previousValue,
  format,
  icon,
  invertColors = false,
  index = 0,
  sparkData,
}: KPICardProps) {
  const animatedValue = useCountUp(value)
  const formattedValue = format === 'currency' ? formatCurrency(animatedValue) : formatPercent(animatedValue)
  const change = previousValue !== undefined ? calculateChange(value, previousValue) : null
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const sparkColor = SPARKLINE_COLORS[index % SPARKLINE_COLORS.length]

  const getChangeColor = () => {
    if (!change) return 'var(--text-muted)'
    if (invertColors) {
      return change.type === 'down' ? 'var(--green)' : 'var(--red)'
    }
    return change.type === 'up' ? 'var(--green)' : 'var(--red)'
  }

  const getChangeBg = () => {
    if (!change) return 'transparent'
    if (invertColors) {
      return change.type === 'down' ? 'var(--success-bg)' : 'var(--error-bg)'
    }
    return change.type === 'up' ? 'var(--success-bg)' : 'var(--error-bg)'
  }

  return (
    <div
      className="stat-card animate-fade-up"
      style={{ animationDelay: `${index * 80}ms`, padding: 'var(--space-4)' }}
      tabIndex={0}
    >
      {/* Gradient top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: gradient,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <span className="stat-label">{title}</span>
        <div
          className="stat-icon"
          style={{
            background: gradient,
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            boxShadow: `0 2px 8px ${sparkColor}40`,
          }}
        >
          <div style={{ color: 'white' }}>{icon}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div>
          <div className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>
            {formattedValue}
          </div>
          {change && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: getChangeColor(),
                  background: getChangeBg(),
                }}
              >
                {change.type === 'up' ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {change.percent}
              </span>
              <span className="text-xs text-muted">vs kỳ trước</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={sparkColor} />
        )}
      </div>
    </div>
  )
}

interface KPIGridProps {
  children: React.ReactNode
}

export function KPIGrid({ children }: KPIGridProps) {
  return (
    <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {children}
    </div>
  )
}
