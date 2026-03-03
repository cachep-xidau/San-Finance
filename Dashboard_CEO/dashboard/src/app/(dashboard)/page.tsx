import { DollarSign, TrendingUp, Percent, Wallet } from 'lucide-react'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { TrendChart } from '@/components/charts/trend-chart'
import { CostBreakdownChart } from '@/components/charts/cost-breakdown-chart'
import { ClinicComparisonTable } from '@/components/tables/clinic-comparison-table'
import { DateRangePicker } from '@/components/filters/date-range-picker'
import { ClinicSelect } from '@/components/filters/clinic-select'
import { getKPIs } from '@/lib/queries/kpis'
import { getTrendData } from '@/lib/queries/trends'
import { getCostBreakdown } from '@/lib/queries/breakdown'
import { getClinicComparison } from '@/lib/queries/comparison'
import { getClinics } from '@/lib/queries/clinics'

// Client component wrapper for filters
import { Suspense } from 'react'

async function DashboardContent({
  clinicId,
  startDate,
  endDate,
}: {
  clinicId?: string
  startDate: Date
  endDate: Date
}) {
  // Fetch all data in parallel
  const [kpis, trendData, breakdown, comparison, clinics] = await Promise.all([
    getKPIs(clinicId, startDate, endDate),
    getTrendData(clinicId, 12),
    getCostBreakdown(clinicId, startDate, endDate),
    getClinicComparison(startDate, endDate),
    getClinics(),
  ])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          value={{ start: startDate, end: endDate }}
          onChange={() => {}}
        />
        <ClinicSelect
          clinics={clinics}
          value={clinicId || null}
          onChange={() => {}}
        />
      </div>

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard
          title="Tổng doanh thu"
          value={kpis.totalRevenue}
          previousValue={kpis.previousRevenue}
          format="currency"
          icon={<DollarSign size={18} style={{ color: 'var(--primary)' }} />}
        />
        <KPICard
          title="Tổng chi phí"
          value={kpis.totalCosts}
          previousValue={kpis.previousCosts}
          format="currency"
          icon={<Wallet size={18} style={{ color: 'var(--primary)' }} />}
          invertColors
        />
        <KPICard
          title="Lợi nhuận ròng"
          value={kpis.netProfit}
          format="currency"
          icon={<TrendingUp size={18} style={{ color: 'var(--primary)' }} />}
        />
        <KPICard
          title="Biên lợi nhuận"
          value={kpis.profitMargin}
          format="percent"
          icon={<Percent size={18} style={{ color: 'var(--primary)' }} />}
        />
      </KPIGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
            Doanh thu vs Chi phí
          </h2>
          <TrendChart data={trendData} />
        </div>

        {/* Cost Breakdown */}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
            Phân bổ chi phí
          </h2>
          <CostBreakdownChart data={breakdown} />
        </div>
      </div>

      {/* Clinic Comparison */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
          So sánh chi nhánh
        </h2>
        <ClinicComparisonTable data={comparison} />
      </div>
    </div>
  )
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-40 rounded-lg" style={{ background: 'var(--surface)' }} />
        <div className="h-10 w-40 rounded-lg" style={{ background: 'var(--surface)' }} />
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[350px] rounded-xl" style={{ background: 'var(--surface)' }} />
        <div className="h-[350px] rounded-xl" style={{ background: 'var(--surface)' }} />
      </div>

      {/* Table skeleton */}
      <div className="h-[300px] rounded-xl" style={{ background: 'var(--surface)' }} />
    </div>
  )
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { clinic?: string; start?: string; end?: string }
}) {
  // Parse date range from URL or default to current month
  const now = new Date()
  const startDate = searchParams.start
    ? new Date(searchParams.start)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = searchParams.end
    ? new Date(searchParams.end)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const clinicId = searchParams.clinic

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
          Tổng quan
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {startDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          clinicId={clinicId}
          startDate={startDate}
          endDate={endDate}
        />
      </Suspense>
    </div>
  )
}
