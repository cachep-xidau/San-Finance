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
import type { BudgetWithDetails } from '@/lib/queries/budgets'

interface BudgetVarianceChartProps {
  budgets: BudgetWithDetails[]
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

export function BudgetVarianceChart({ budgets }: BudgetVarianceChartProps) {
  if (!budgets || budgets.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[300px] rounded-lg"
        style={{ background: 'var(--background)' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu ngân sách</span>
      </div>
    )
  }

  // Aggregate by category (simplified - use category code prefix)
  const categoryMap = new Map<string, { budget: number; actual: number }>()

  for (const b of budgets) {
    const prefix = b.category_code.split('.')[0] // GIAVON, CPBH, QLDN, etc.
    const existing = categoryMap.get(prefix) || { budget: 0, actual: 0 }
    existing.budget += b.amount
    // Simulate actual with variance (in real app, fetch from expenses)
    existing.actual += b.amount * (0.85 + Math.random() * 0.3)
    categoryMap.set(prefix, existing)
  }

  const categoryNames: Record<string, string> = {
    GIAVON: 'Giá vốn',
    CPBH: 'Chi phí BH',
    QLDN: 'QLDN',
    THUE: 'Thuế',
    KHAC: 'Khác',
  }

  const data = Array.from(categoryMap.entries())
    .filter(([prefix]) => categoryNames[prefix])
    .map(([prefix, values]) => ({
      category: categoryNames[prefix] || prefix,
      budget: values.budget,
      actual: values.actual,
      variance: values.actual - values.budget,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="category"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value) => (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value}</span>
          )}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Bar
          dataKey="budget"
          name="Ngân sách"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="actual"
          name="Thực tế"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="variance"
          name="Chênh lệch"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
