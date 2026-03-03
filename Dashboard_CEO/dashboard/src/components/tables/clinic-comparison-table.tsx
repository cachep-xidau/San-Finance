import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ClinicComparison } from '@/lib/queries/comparison'

interface ClinicComparisonTableProps {
  data: ClinicComparison[]
}

const formatCurrency = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  return `${(value / 1e3).toFixed(0)}K`
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`

export function ClinicComparisonTable({ data }: ClinicComparisonTableProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[200px] rounded-lg"
        style={{ background: 'var(--background)' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu</span>
      </div>
    )
  }

  // Find best performer
  const bestMargin = Math.max(...data.map(d => d.margin))
  const bestProfit = Math.max(...data.map(d => d.profit))

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Chi nhánh
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Doanh thu
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Chi phí
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Lợi nhuận
            </th>
            <th className="text-right py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Biên LN
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((clinic) => (
            <tr
              key={clinic.clinicId}
              className="hover:bg-gray-50 transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: 'var(--primary)' }}
                  >
                    {clinic.clinicName.charAt(0)}
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                    {clinic.clinicName}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right" style={{ color: 'var(--text-main)' }}>
                {formatCurrency(clinic.revenue)}
              </td>
              <td className="py-3 px-2 text-right" style={{ color: 'var(--text-main)' }}>
                {formatCurrency(clinic.costs)}
              </td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {clinic.profit === bestProfit && clinic.profit > 0 && (
                    <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                  )}
                  <span
                    className="font-medium"
                    style={{
                      color: clinic.profit >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {formatCurrency(clinic.profit)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {clinic.margin === bestMargin && clinic.margin > 0 && (
                    <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                  )}
                  {clinic.margin < 0 && (
                    <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
                  )}
                  <span
                    className="font-medium"
                    style={{
                      color: clinic.margin >= 0 ? 'var(--text-main)' : 'var(--danger)',
                    }}
                  >
                    {formatPercent(clinic.margin)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        {/* Total row */}
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border)' }}>
            <td className="py-3 px-2 font-semibold" style={{ color: 'var(--text-main)' }}>
              Tổng cộng
            </td>
            <td className="py-3 px-2 text-right font-semibold" style={{ color: 'var(--text-main)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.revenue, 0))}
            </td>
            <td className="py-3 px-2 text-right font-semibold" style={{ color: 'var(--text-main)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.costs, 0))}
            </td>
            <td className="py-3 px-2 text-right font-semibold" style={{ color: 'var(--success)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.profit, 0))}
            </td>
            <td className="py-3 px-2 text-right font-semibold" style={{ color: 'var(--text-main)' }}>
              {formatPercent(
                data.reduce((sum, c) => sum + c.profit, 0) /
                data.reduce((sum, c) => sum + c.revenue, 0) * 100 || 0
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
