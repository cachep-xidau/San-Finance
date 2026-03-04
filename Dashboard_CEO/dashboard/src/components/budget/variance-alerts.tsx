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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {items.map((item, index) => (
        <VarianceAlertCard key={index} item={item} />
      ))}
    </div>
  )
}

function VarianceAlertCard({ item }: { item: VarianceItem }) {
  const isOver = item.variance > 0
  const Icon = isOver ? TrendingUp : TrendingDown

  const bgColor = item.status === 'critical' ? 'var(--error-bg)' : 'var(--warning-bg)'
  const textColor = item.status === 'critical' ? 'var(--red)' : 'var(--warning)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: bgColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Icon size={18} style={{ color: textColor }} />
        <div>
          <p style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', color: textColor }}>
            {item.category}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: textColor, opacity: 0.8 }}>
            {isOver ? 'Vượt' : 'Thiếu'} {formatCurrency(Math.abs(item.variance))} ({Math.abs(item.variancePct).toFixed(1)}%)
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: textColor, opacity: 0.7 }}>
          Ngân sách: {formatCurrency(item.budget)}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: textColor }}>
          Thực tế: {formatCurrency(item.actual)}
        </p>
      </div>
    </div>
  )
}

interface VarianceBadgeProps {
  count: number
  criticalCount: number
}

export function VarianceBadge({ count, criticalCount }: VarianceBadgeProps) {
  if (count === 0) return null

  return (
    <div
      className="status-badge"
      style={{
        background: criticalCount > 0 ? 'var(--error-bg)' : 'var(--warning-bg)',
        color: criticalCount > 0 ? 'var(--red)' : 'var(--warning)',
        border: `1px solid ${criticalCount > 0 ? 'var(--error-border)' : 'var(--warning-border)'}`,
      }}
    >
      <AlertTriangle size={12} />
      <span>{count} cảnh báo</span>
      {criticalCount > 0 && (
        <span style={{ fontWeight: 'var(--weight-bold)' }}>({criticalCount} nghiêm trọng)</span>
      )}
    </div>
  )
}
