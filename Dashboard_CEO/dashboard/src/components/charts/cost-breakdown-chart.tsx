'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { BreakdownDataPoint } from '@/lib/queries/breakdown'

interface CostBreakdownChartProps {
  data: BreakdownDataPoint[]
  colors?: Record<string, string>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280']

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
        className="p-3 rounded-lg shadow-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="font-medium" style={{ color: 'var(--text-main)' }}>{data.name}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {formatValue(data.value)} ({data.payload.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegend = (props: any) => {
  const { payload } = props
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload?.map((entry: { value: string; color: string }, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
