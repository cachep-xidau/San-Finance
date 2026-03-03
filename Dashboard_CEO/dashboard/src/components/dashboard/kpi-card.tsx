import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent, calculateChange } from '@/lib/queries/kpis'

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format: 'currency' | 'percent'
  icon: React.ReactNode
  invertColors?: boolean
}

export function KPICard({
  title,
  value,
  previousValue,
  format,
  icon,
  invertColors = false,
}: KPICardProps) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : formatPercent(value)
  const change = previousValue !== undefined ? calculateChange(value, previousValue) : null

  // Determine color based on change direction and invertColors
  // For costs, up is bad (red), for profit, up is good (green)
  const getChangeColor = () => {
    if (!change) return 'var(--text-muted)'
    if (invertColors) {
      return change.type === 'down' ? 'var(--success)' : 'var(--danger)'
    }
    return change.type === 'up' ? 'var(--success)' : 'var(--danger)'
  }

  return (
    <div
      className="p-4 rounded-xl transition-shadow hover:shadow-md"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div
          className="p-2 rounded-lg"
          style={{ background: 'var(--primary-soft)' }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
        {formattedValue}
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-1">
          {change.type === 'up' ? (
            <TrendingUp size={14} style={{ color: getChangeColor() }} />
          ) : (
            <TrendingDown size={14} style={{ color: getChangeColor() }} />
          )}
          <span className="text-xs" style={{ color: getChangeColor() }}>
            {change.percent} vs kỳ trước
          </span>
        </div>
      )}
    </div>
  )
}

interface KPIGridProps {
  children: React.ReactNode
}

export function KPIGrid({ children }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
