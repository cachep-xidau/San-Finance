'use client'

import { TrendingUp, TrendingDown, Trophy } from 'lucide-react'
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

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #8B5CF6, #A855F7)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
]

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#7C4D00', shadow: 'rgba(255,215,0,0.3)' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#4A4A4A', shadow: 'rgba(192,192,192,0.3)' },
  { bg: 'linear-gradient(135deg, #CD7F32, #B8723A)', color: '#4A2C0A', shadow: 'rgba(205,127,50,0.3)' },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null
  const style = RANK_STYLES[rank - 1]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-bold)',
        background: style.bg,
        color: style.color,
        boxShadow: `0 2px 6px ${style.shadow}`,
        flexShrink: 0,
      }}
    >
      {rank}
    </div>
  )
}

export function ClinicComparisonTable({ data }: ClinicComparisonTableProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Không có dữ liệu</span>
      </div>
    )
  }

  const sortedByMargin = [...data].sort((a, b) => b.margin - a.margin)
  const marginRankMap = new Map(sortedByMargin.map((c, i) => [c.clinicId, i + 1]))

  const bestProfit = Math.max(...data.map(d => d.profit))
  const maxMargin = Math.max(...data.map(d => Math.abs(d.margin)), 1)

  return (
    <div className="san-table-wrap">
      <table className="san-table">
        <thead>
          <tr>
            <th className="san-th">Chi nhánh</th>
            <th className="san-th" style={{ textAlign: 'right' }}>Doanh thu</th>
            <th className="san-th" style={{ textAlign: 'right' }}>Chi phí</th>
            <th className="san-th" style={{ textAlign: 'right' }}>Lợi nhuận</th>
            <th className="san-th" style={{ textAlign: 'right' }}>Biên LN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((clinic, index) => {
            const rank = marginRankMap.get(clinic.clinicId) ?? 99
            return (
              <tr
                key={clinic.clinicId}
                style={{
                  background: index % 2 === 1 ? 'var(--bg-surface)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 1 ? 'var(--bg-surface)' : 'transparent'
                }}
              >
                <td className="san-td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <RankBadge rank={rank} />
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--weight-semibold)',
                        background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {clinic.clinicName.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                      {clinic.clinicName}
                    </span>
                  </div>
                </td>
                <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-medium)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                  {formatCurrency(clinic.revenue)}
                </td>
                <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-medium)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                  {formatCurrency(clinic.costs)}
                </td>
                <td className="san-td" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    {clinic.profit === bestProfit && clinic.profit > 0 && (
                      <Trophy size={14} style={{ color: '#FFD700' }} />
                    )}
                    <span
                      style={{
                        fontWeight: 'var(--weight-semibold)',
                        fontVariantNumeric: 'tabular-nums',
                        color: clinic.profit >= 0 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {formatCurrency(clinic.profit)}
                    </span>
                  </div>
                </td>
                <td className="san-td" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      {clinic.margin > 0 && rank <= 3 && (
                        <TrendingUp size={14} style={{ color: 'var(--green)' }} />
                      )}
                      {clinic.margin < 0 && (
                        <TrendingDown size={14} style={{ color: 'var(--red)' }} />
                      )}
                      <span
                        style={{
                          fontWeight: 'var(--weight-semibold)',
                          fontVariantNumeric: 'tabular-nums',
                          color: clinic.margin >= 0 ? 'var(--text-primary)' : 'var(--red)',
                        }}
                      >
                        {formatPercent(clinic.margin)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        width: 56,
                        height: 8,
                        borderRadius: 'var(--radius-pill)',
                        overflow: 'hidden',
                        background: 'var(--bg-surface)',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(Math.abs(clinic.margin) / maxMargin * 100, 100)}%`,
                          height: '100%',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'width 0.5s ease',
                          background: clinic.margin >= 0
                            ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                            : 'linear-gradient(90deg, #EF4444, #F97316)',
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border)' }}>
            <td className="san-td" style={{ fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Tổng cộng</td>
            <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.revenue, 0))}
            </td>
            <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.costs, 0))}
            </td>
            <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>
              {formatCurrency(data.reduce((sum, c) => sum + c.profit, 0))}
            </td>
            <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
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
