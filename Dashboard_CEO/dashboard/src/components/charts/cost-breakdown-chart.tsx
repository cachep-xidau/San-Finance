'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useState, useCallback } from 'react'
import type { BreakdownDataPoint } from '@/lib/queries/breakdown'

interface CostBreakdownChartProps {
  data: BreakdownDataPoint[]
  colors?: Record<string, string>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1']

const formatValue = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} tr`
  return `${(value / 1e3).toFixed(0)}K`
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{data.name}</p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', color: 'var(--text-muted)' }}>
          {formatValue(data.value)} ({data.payload.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

const CenterLabel = ({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: string }) => {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>
        Tổng chi phí
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-primary)' }}>
        {total}
      </text>
    </g>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegend = (props: any) => {
  const { payload } = props
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
      {payload?.map((entry: { value: string; color: string }, index: number) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            background: `${entry.color}15`,
            color: entry.color,
            fontWeight: 'var(--weight-medium)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const onCellEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index)
  }, [])

  const onCellLeave = useCallback(() => {
    setActiveIndex(null)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 240,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu</span>
      </div>
    )
  }

  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div style={{ cursor: 'pointer' }}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={4}
            dataKey="amount"
            nameKey="category"
            cornerRadius={4}
            onMouseLeave={onCellLeave}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={activeIndex === index ? 'white' : 'transparent'}
                strokeWidth={activeIndex === index ? 3 : 0}
                style={{
                  filter: activeIndex === index ? `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}60)` : 'none',
                  transition: 'filter 0.2s ease, stroke 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => onCellEnter(e, index)}
              />
            ))}
            <CenterLabel total={formatValue(totalAmount)} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
