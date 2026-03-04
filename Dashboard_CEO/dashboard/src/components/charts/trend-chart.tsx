'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { TrendDataPoint } from '@/lib/queries/trends'

interface TrendChartProps {
  data: TrendDataPoint[]
}

const formatYAxis = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(0)} tỷ`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)} tr`
  return `${(value / 1e3).toFixed(0)}K`
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
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
        <p style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', padding: '2px 0' }}>
            <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-pill)', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 'var(--weight-medium)', color: entry.color }}>{formatYAxis(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

/** Glowing active dot for hover state */
const GlowDot = (color: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Dot = (props: any) => {
    const { cx, cy } = props
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.15} />
        <circle cx={cx} cy={cy} r={5} fill="white" stroke={color} strokeWidth={2.5} />
      </g>
    )
  }
  Dot.displayName = `GlowDot-${color}`
  return Dot
}

export function TrendChart({ data }: TrendChartProps) {
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

  return (
    <div style={{ cursor: 'pointer' }}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="40%" stopColor="#10B981" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="40%" stopColor="#EF4444" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="40%" stopColor="#3B82F6" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>{value}</span>
            )}
          />
          <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" activeDot={GlowDot('#10B981')} />
          <Area type="monotone" dataKey="costs" name="Chi phí" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCosts)" activeDot={GlowDot('#EF4444')} />
          <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" activeDot={GlowDot('#3B82F6')} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
