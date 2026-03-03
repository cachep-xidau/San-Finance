import { DollarSign, TrendingUp, Percent, Wallet } from 'lucide-react'
import { Suspense } from 'react'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { TrendChart } from '@/components/charts/trend-chart'
import { CostBreakdownChart } from '@/components/charts/cost-breakdown-chart'
import { ClinicComparisonTable } from '@/components/tables/clinic-comparison-table'
import { DashboardFilters } from '@/components/filters/dashboard-filters'
import { getKPIs } from '@/lib/queries/kpis'
import { getTrendData } from '@/lib/queries/trends'
import { getCostBreakdown } from '@/lib/queries/breakdown'
import { getClinicComparison } from '@/lib/queries/comparison'
import { getClinics } from '@/lib/queries/clinics'

function parseDateParam(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function toDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function DashboardContent({
  clinicId,
  startDate,
  endDate,
}: {
  clinicId?: string
  startDate: Date
  endDate: Date
}) {
  const [kpis, trendData, breakdown, comparison] = await Promise.all([
    getKPIs(clinicId, startDate, endDate),
    getTrendData(clinicId, 12),
    getCostBreakdown(clinicId, startDate, endDate),
    getClinicComparison(startDate, endDate),
  ])

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div id="revenue-trend" className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
            Doanh thu vs Chi phí
          </h2>
          <TrendChart data={trendData} />
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
            Phân bổ chi phí
          </h2>
          <CostBreakdownChart data={breakdown} />
        </div>
      </div>

      <div id="clinic-comparison" className="p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-main)' }}>
          So sánh chi nhánh
        </h2>
        <ClinicComparisonTable data={comparison} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[350px] rounded-xl" style={{ background: 'var(--surface)' }} />
        <div className="h-[350px] rounded-xl" style={{ background: 'var(--surface)' }} />
      </div>

      <div className="h-[300px] rounded-xl" style={{ background: 'var(--surface)' }} />
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { clinic?: string; start?: string; end?: string }
}) {
  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startDate = parseDateParam(searchParams.start, defaultStart)
  const endDate = parseDateParam(searchParams.end, defaultEnd)
  const clinicId = searchParams.clinic

  const clinics = await getClinics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
          Tổng quan
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {startDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <DashboardFilters
        clinics={clinics}
        clinicId={clinicId ?? null}
        startDate={toDateParam(startDate)}
        endDate={toDateParam(endDate)}
      />

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
