import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { getBudgets, getBudgetVariance } from '@/lib/queries/budgets'
import { getClinics } from '@/lib/queries/clinics'
import { BudgetTable } from '@/components/budget/budget-table'
import { BudgetVarianceChart } from '@/components/charts/budget-variance-chart'

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: { clinic?: string; year?: string; month?: string }
}) {
  const now = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1
  const clinicId = searchParams.clinic

  const [budgets, clinics, variances] = await Promise.all([
    getBudgets(clinicId, year, month),
    getClinics(),
    clinicId ? getBudgetVariance(clinicId, year, month) : Promise.resolve([]),
  ])

  const effectiveVariances = clinicId
    ? variances
    : clinics.length > 0
      ? await getBudgetVariance(clinics[0].id, year, month)
      : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
            Ngân sách
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Tháng {month}/{year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
          >
            <Download size={16} />
            Xuất Excel
          </button>
          <Link
            href="/budget/new"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={16} />
            Thêm ngân sách
          </Link>
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--surface)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
          Ngân sách vs Thực tế
        </h2>
        <BudgetVarianceChart variances={effectiveVariances} />
      </div>

      {/* Budget Table */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--surface)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
          Chi tiết ngân sách
        </h2>
        <BudgetTable budgets={budgets} />
      </div>
    </div>
  )
}
