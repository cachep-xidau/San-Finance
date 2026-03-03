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
        className="flex flex-col items-center justify-center py-12"
        style={{ color: 'var(--text-muted)' }}
      >
        <p>Chưa có ngân sách nào</p>
        <p className="text-sm mt-1">Nhấn &quot;Thêm ngân sách&quot; để bắt đầu</p>
      </div>
    )
  }

  // Group by clinic
  const groupedByClinic = budgets.reduce((acc, budget) => {
    const clinicName = budget.clinic_name
    if (!acc[clinicName]) {
      acc[clinicName] = []
    }
    acc[clinicName].push(budget)
    return acc
  }, {} as Record<string, BudgetItem[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedByClinic).map(([clinicName, clinicBudgets]) => (
        <div key={clinicName}>
          <h3
            className="text-sm font-medium mb-2 pb-2 border-b"
            style={{ color: 'var(--text-main)', borderColor: 'var(--border)' }}
          >
            {clinicName}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Hạng mục
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Kỳ
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Số tiền
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {clinicBudgets.map((budget) => (
                  <tr key={budget.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-2" style={{ color: 'var(--text-main)' }}>
                      <div className="flex flex-col">
                        <span className="text-sm">{budget.category_name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {budget.category_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {getMonthName(budget.month)}/{budget.year}
                    </td>
                    <td className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-main)' }}>
                      {formatCurrency(budget.amount)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                          title="Sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded hover:opacity-80"
                          style={{ color: 'var(--danger)' }}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td className="py-2 px-2 font-medium" style={{ color: 'var(--text-main)' }}>
                    Tổng
                  </td>
                  <td></td>
                  <td className="py-2 px-2 text-right font-semibold" style={{ color: 'var(--primary)' }}>
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
