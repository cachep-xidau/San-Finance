'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { BudgetVariance } from '@/lib/queries/budgets'

interface BudgetVarianceChartProps {
  variances: BudgetVariance[]
}

const formatYAxis = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(0)} tỷ`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
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

export function BudgetVarianceChart({ variances }: BudgetVarianceChartProps) {
  if (!variances || variances.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu ngân sách</span>
      </div>
    )
  }

  const data = variances.map((item) => ({
    category: item.category,
    budget: item.budget,
    actual: item.actual,
    variance: item.variance,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="category"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
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
        <ReferenceLine y={0} stroke="var(--border)" />
        <Bar dataKey="budget" name="Ngân sách" fill="#3B82F6" radius={[6, 6, 0, 0]} />
        <Bar dataKey="actual" name="Thực tế" fill="#10B981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="variance" name="Chênh lệch" fill="#EF4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
