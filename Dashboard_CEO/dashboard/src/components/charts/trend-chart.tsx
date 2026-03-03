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
        className="p-3 rounded-lg shadow-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="font-medium mb-2" style={{ color: 'var(--text-main)' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatYAxis(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[240px] rounded-lg"
        style={{ background: 'var(--background)' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value) => (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Doanh thu"
          stroke="#10B981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="costs"
          name="Chi phí"
          stroke="#EF4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCosts)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Lợi nhuận"
          stroke="#3B82F6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
