import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface VarianceItem {
  category: string
  budget: number
  actual: number
  variance: number
  variancePct: number
  status: 'ok' | 'warning' | 'critical'
}

interface VarianceAlertListProps {
  items: VarianceItem[]
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  return `${(value / 1e3).toFixed(0)}K`
}

export function VarianceAlertList({ items }: VarianceAlertListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <VarianceAlertCard key={index} item={item} />
      ))}
    </div>
  )
}

function VarianceAlertCard({ item }: { item: VarianceItem }) {
  const isOver = item.variance > 0
  const Icon = isOver ? TrendingUp : TrendingDown

  const bgColor = item.status === 'critical'
    ? 'var(--danger-soft)'
    : 'var(--warning-soft)'
  const textColor = item.status === 'critical'
    ? 'var(--danger)'
    : 'var(--warning)'

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ background: bgColor }}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} style={{ color: textColor }} />
        <div>
          <p className="font-medium text-sm" style={{ color: textColor }}>
            {item.category}
          </p>
          <p className="text-xs" style={{ color: textColor, opacity: 0.8 }}>
            {isOver ? 'Vượt' : 'Thiếu'} {formatCurrency(Math.abs(item.variance))} ({Math.abs(item.variancePct).toFixed(1)}%)
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>
          Ngân sách: {formatCurrency(item.budget)}
        </p>
        <p className="text-xs font-medium" style={{ color: textColor }}>
          Thực tế: {formatCurrency(item.actual)}
        </p>
      </div>
    </div>
  )
}

// Summary badge for dashboard header
interface VarianceBadgeProps {
  count: number
  criticalCount: number
}

export function VarianceBadge({ count, criticalCount }: VarianceBadgeProps) {
  if (count === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        background: criticalCount > 0 ? 'var(--danger-soft)' : 'var(--warning-soft)',
        color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)',
      }}
    >
      <AlertTriangle size={12} />
      <span>{count} cảnh báo</span>
      {criticalCount > 0 && (
        <span className="font-bold">({criticalCount} nghiêm trọng)</span>
      )}
    </div>
  )
}
