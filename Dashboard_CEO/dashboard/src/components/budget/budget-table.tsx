import { Pencil, Trash2 } from 'lucide-react'

interface BudgetItem {
  id: string
  clinic_name: string
  category_name: string
  category_code: string
  year: number
  month: number | null
  amount: number
}

interface BudgetTableProps {
  budgets: BudgetItem[]
}

const formatCurrency = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  return `${(value / 1e3).toFixed(0)}K`
}

const getMonthName = (month: number | null) => {
  if (month === null) return 'Cả năm'
  return `Tháng ${month}`
}

export function BudgetTable({ budgets }: BudgetTableProps) {
  if (budgets.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) 0',
          color: 'var(--text-muted)',
        }}
      >
        <p>Chưa có ngân sách nào</p>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Nhấn &quot;Thêm ngân sách&quot; để bắt đầu</p>
      </div>
    )
  }

  const groupedByClinic = budgets.reduce((acc, budget) => {
    const clinicName = budget.clinic_name
    if (!acc[clinicName]) {
      acc[clinicName] = []
    }
    acc[clinicName].push(budget)
    return acc
  }, {} as Record<string, BudgetItem[]>)

  return (
    <div className="stack">
      {Object.entries(groupedByClinic).map(([clinicName, clinicBudgets]) => (
        <div key={clinicName}>
          <h3
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              marginBottom: 'var(--space-2)',
              paddingBottom: 'var(--space-2)',
              color: 'var(--text-primary)',
              borderBottom: '2px solid var(--border)',
            }}
          >
            {clinicName}
          </h3>
          <div className="san-table-wrap">
            <table className="san-table">
              <thead>
                <tr>
                  <th className="san-th">Hạng mục</th>
                  <th className="san-th">Kỳ</th>
                  <th className="san-th" style={{ textAlign: 'right' }}>Số tiền</th>
                  <th className="san-th" style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {clinicBudgets.map((budget, index) => (
                  <tr
                    key={budget.id}
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
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{budget.category_name}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{budget.category_code}</span>
                      </div>
                    </td>
                    <td className="san-td" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      {getMonthName(budget.month)}/{budget.year}
                    </td>
                    <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(budget.amount)}
                    </td>
                    <td className="san-td" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <button className="btn-icon" title="Sửa" style={{ padding: 6 }}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-icon" title="Xóa" style={{ padding: 6, color: 'var(--red)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td className="san-td" style={{ fontWeight: 'var(--weight-bold)' }}>Tổng</td>
                  <td></td>
                  <td className="san-td" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                    {formatCurrency(clinicBudgets.reduce((sum, b) => sum + b.amount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
