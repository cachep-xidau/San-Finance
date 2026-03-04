import { DollarSign, TrendingUp, Percent, Wallet, Building2, CalendarDays, CircleAlert } from 'lucide-react'
import { Suspense, type ReactNode } from 'react'
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

function formatDateRange(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

const META_ACCENTS = [
  { border: 'var(--accent)', bg: 'var(--primary-bg)' },
  { border: 'var(--green)', bg: 'var(--success-bg)' },
  { border: 'var(--orange)', bg: 'var(--warning-bg)' },
]

function MetaCard({ icon, title, value, accent = 0 }: { icon: ReactNode; title: string; value: ReactNode; accent?: number }) {
  const a = META_ACCENTS[accent % META_ACCENTS.length]
  return (
    <div
      className="meta-card animate-fade-up"
      style={{
        background: a.bg,
        borderLeftColor: a.border,
        animationDelay: `${accent * 60}ms`,
      }}
    >
      <div className="meta-card-title">
        {icon} {title}
      </div>
      <div className="meta-card-value">
        {value}
      </div>
    </div>
  )
}

async function DashboardContent({ clinicId, startDate, endDate, clinicLabel, periodLabel }: {
  clinicId?: string
  startDate: Date
  endDate: Date
  clinicLabel: string
  periodLabel: string
}) {
  const [kpis, trendData, breakdown, comparison] = await Promise.all([
    getKPIs(clinicId, startDate, endDate),
    getTrendData(clinicId, 12),
    getCostBreakdown(clinicId, startDate, endDate),
    getClinicComparison(startDate, endDate),
  ])

  const isProfitable = kpis.netProfit >= 0
  const statusLabel = isProfitable ? 'Đang có lãi' : 'Cần tối ưu chi phí'
  const statusBadge = (
    <span
      className="status-badge"
      style={{
        color: isProfitable ? 'var(--green)' : 'var(--red)',
        background: isProfitable ? 'var(--success-bg)' : 'var(--error-bg)',
        border: `1px solid ${isProfitable ? 'var(--success-border)' : 'var(--error-border)'}`,
      }}
    >
      {statusLabel}
    </span>
  )

  const recentTrend = trendData.slice(-6)
  const revenueSparkData = recentTrend.map(d => d.revenue)
  const costsSparkData = recentTrend.map(d => d.costs)
  const profitSparkData = recentTrend.map(d => d.profit)
  const marginSparkData = recentTrend.map(d => d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0)

  return (
    <div className="stack">
      <div className="grid-3">
        <MetaCard icon={<Building2 size={14} />} title="Chi nhánh" value={clinicLabel} accent={0} />
        <MetaCard icon={<CalendarDays size={14} />} title="Kỳ báo cáo" value={periodLabel} accent={1} />
        <MetaCard icon={<CircleAlert size={14} />} title="Trạng thái" value={statusBadge} accent={2} />
      </div>

      <KPIGrid>
        <KPICard
          title="Tổng doanh thu"
          value={kpis.totalRevenue}
          previousValue={kpis.previousRevenue}
          format="currency"
          icon={<DollarSign size={18} />}
          index={0}
          sparkData={revenueSparkData}
        />
        <KPICard
          title="Tổng chi phí"
          value={kpis.totalCosts}
          previousValue={kpis.previousCosts}
          format="currency"
          icon={<Wallet size={18} />}
          invertColors
          index={1}
          sparkData={costsSparkData}
        />
        <KPICard
          title="Lợi nhuận ròng"
          value={kpis.netProfit}
          format="currency"
          icon={<TrendingUp size={18} />}
          index={2}
          sparkData={profitSparkData}
        />
        <KPICard
          title="Biên lợi nhuận"
          value={kpis.profitMargin}
          format="percent"
          icon={<Percent size={18} />}
          index={3}
          sparkData={marginSparkData}
        />
      </KPIGrid>

      <div className="grid-2">
        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h2 className="dashboard-section-title">Doanh thu vs Chi phí</h2>
          <p className="dashboard-section-subtitle">Xu hướng theo 12 tháng gần nhất</p>
          <TrendChart data={trendData} />
        </section>

        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '280ms' }}>
          <h2 className="dashboard-section-title">Phân bổ chi phí</h2>
          <p className="dashboard-section-subtitle">Tỷ trọng theo danh mục chi phí</p>
          <CostBreakdownChart data={breakdown} />
        </section>
      </div>

      <section className="dashboard-section animate-fade-up" style={{ animationDelay: '360ms' }}>
        <h2 className="dashboard-section-title">So sánh chi nhánh</h2>
        <p className="dashboard-section-subtitle">Hiệu suất theo doanh thu, chi phí và biên lợi nhuận</p>
        <ClinicComparisonTable data={comparison} />
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="stack">
      {/* Meta cards skeleton */}
      <div className="grid-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 80, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      {/* KPI cards skeleton */}
      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 128, animationDelay: `${300 + i * 80}ms` }}
          />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid-2">
        <div className="skeleton-shimmer" style={{ height: 350, animationDelay: '700ms' }} />
        <div className="skeleton-shimmer" style={{ height: 350, animationDelay: '780ms' }} />
      </div>
      {/* Table skeleton */}
      <div className="skeleton-shimmer" style={{ height: 300, animationDelay: '860ms' }} />
    </div>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: { clinic?: string; start?: string; end?: string } }) {
  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startDate = parseDateParam(searchParams.start, defaultStart)
  const endDate = parseDateParam(searchParams.end, defaultEnd)
  const clinicId = searchParams.clinic

  const clinics = await getClinics()
  const selectedClinic = clinicId ? clinics.find((clinic) => clinic.id === clinicId) : null
  const clinicLabel = selectedClinic?.name ?? 'Tất cả chi nhánh'
  const periodLabel = formatDateRange(startDate, endDate)

  return (
    <div className="stack">
      {/* Hero Section */}
      <section className="glass-panel" style={{ padding: 'var(--space-4) var(--space-6)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            pointerEvents: 'none',
            background: 'var(--gradient-brand)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <p
            className="uppercase tracking-wider font-semibold"
            style={{
              fontSize: 'var(--text-xs)',
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            S Group CEO Dashboard
          </p>
          <h1 style={{ marginTop: 'var(--space-2)' }}>Tổng quan tài chính</h1>
          <p className="text-sm text-muted" style={{ marginTop: 'var(--space-1)' }}>Theo dõi doanh thu, chi phí và lợi nhuận theo thời gian thực.</p>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <DashboardFilters
              clinics={clinics}
              clinicId={clinicId ?? null}
              startDate={toDateParam(startDate)}
              endDate={toDateParam(endDate)}
            />
          </div>
        </div>
      </section>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent clinicId={clinicId} startDate={startDate} endDate={endDate} clinicLabel={clinicLabel} periodLabel={periodLabel} />
      </Suspense>
    </div>
  )
}
