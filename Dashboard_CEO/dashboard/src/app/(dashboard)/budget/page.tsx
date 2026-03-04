import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { getBudgets, getBudgetVariance } from '@/lib/queries/budgets'
import { BudgetTable } from '@/components/budget/budget-table'
import { BudgetVarianceChart } from '@/components/charts/budget-variance-chart'

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: { clinic?: string; year?: string; month?: string }
}) {
  const now = new Date()
  const parsedYear = Number.parseInt(searchParams.year ?? '', 10)
  const parsedMonth = Number.parseInt(searchParams.month ?? '', 10)

  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
    ? parsedYear
    : now.getFullYear()

  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : now.getMonth() + 1
  const clinicId = searchParams.clinic

  const [budgets, variances] = await Promise.all([
    getBudgets(clinicId, year, month),
    getBudgetVariance(clinicId ?? null, year, month),
  ])

  return (
    <div className="stack">
      {/* Header */}
      <div className="san-page-header">
        <div>
          <h1 className="san-page-title">Ngân sách</h1>
          <p className="san-page-subtitle">Tháng {month}/{year}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-sm">
            <Download size={16} />
            Xuất Excel
          </button>
          <Link href="/budget/new" className="btn-primary btn-sm">
            <Plus size={16} />
            Thêm ngân sách
          </Link>
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Ngân sách vs Thực tế</h2>
        <BudgetVarianceChart variances={variances} />
      </section>

      {/* Budget Table */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Chi tiết ngân sách</h2>
        <BudgetTable budgets={budgets} />
      </section>
    </div>
  )
}
