import { DollarSign, TrendingUp, Percent, Wallet } from 'lucide-react'
import { Suspense } from 'react'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { TrendBarChart } from '@/components/charts/trend-chart'
import { CostBreakdownChart } from '@/components/charts/cost-breakdown-chart'
import { CostRevenueRatioChart } from '@/components/charts/cost-revenue-ratio-chart'
import { YoYComparisonChart } from '@/components/charts/yoy-comparison-chart'
import { ClinicComparisonTable } from '@/components/tables/clinic-comparison-table'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { getKPIs } from '@/lib/queries/kpis'
import { getTrendData } from '@/lib/queries/trends'
import { getCostBreakdown } from '@/lib/queries/breakdown'
import { getClinicComparison } from '@/lib/queries/comparison'
import { getCostsByClassify } from '@/lib/queries/cost-analysis'
import { formatCurrency } from '@/lib/format'

function parseDateParam(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ clinic?: string; start?: string; end?: string }> }) {
  const params = await searchParams
  const now = new Date()
  // Default to last 3 months
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startDate = parseDateParam(params.start, defaultStart)
  const endDate = parseDateParam(params.end, defaultEnd)
  const clinicId = params.clinic || undefined

  // Fetch all data in parallel (including previous year data)
  const currentYear = now.getFullYear()
  const previousYear = currentYear - 1
  const [kpis, trendData, previousTrendData, breakdown, comparison, costsByClassifyCurrent, costsByClassifyPrev] = await Promise.all([
    getKPIs(clinicId, startDate, endDate),
    getTrendData(clinicId, 12),
    getTrendData(clinicId, 24).then(data => data.slice(0, 12)), // previous 12 months
    getCostBreakdown(clinicId, startDate, endDate),
    getClinicComparison(startDate, endDate),
    getCostsByClassify(currentYear, clinicId),
    getCostsByClassify(previousYear, clinicId),
  ])

  // Merge costs from both years: prefix month keys with year
  const mergeCosts = (data: typeof costsByClassifyCurrent, year: number) => {
    return data.map(d => ({
      ...d,
      months: Object.fromEntries(
        Object.entries(d.months).map(([mm, v]) => [`${year}.${mm}`, v])
      ),
    }))
  }

  // Combine both years into unified costsByClassify (using full month keys)
  const costsByClassifyMerged = (() => {
    const map = new Map<string, { classify: string; finance: string; months: Record<string, number>; total: number }>()
    for (const item of [...mergeCosts(costsByClassifyCurrent, currentYear), ...mergeCosts(costsByClassifyPrev, previousYear)]) {
      if (!map.has(item.classify)) {
        map.set(item.classify, { classify: item.classify, finance: item.finance, months: {}, total: 0 })
      }
      const entry = map.get(item.classify)!
      for (const [k, v] of Object.entries(item.months)) {
        entry.months[k] = (entry.months[k] || 0) + v
        entry.total += v
      }
    }
    return Array.from(map.values())
  })()

  // Per-clinic revenues for the cards
  const [allKpi, sanKpi, teennieKpi, implantKpi] = await Promise.all([
    getKPIs(undefined, startDate, endDate),
    getKPIs('San', startDate, endDate),
    getKPIs('Teennie', startDate, endDate),
    getKPIs('Implant', startDate, endDate),
  ])

  const clinicTotals = {
    all: allKpi.totalRevenue,
    San: sanKpi.totalRevenue,
    Teennie: teennieKpi.totalRevenue,
    Implant: implantKpi.totalRevenue,
  }

  // Calculate months in selected period for sparkline data
  const selectedMonths = Math.max(1,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
  )
  // Use selectedMonths (capped to available trendData length) for sparklines
  const sparkSlice = Math.min(selectedMonths, trendData.length)
  const recentTrend = trendData.slice(-sparkSlice)
  const revenueSparkData = recentTrend.map(d => d.revenue)
  const costsSparkData = recentTrend.map(d => d.costs)
  const profitSparkData = recentTrend.map(d => d.profit)
  const marginSparkData = recentTrend.map(d => d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0)

  return (
    <DashboardClient
      selectedClinic={clinicId || null}
      clinicTotals={clinicTotals}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
    >
      <KPIGrid>
        <KPICard title="Tổng doanh thu" value={kpis.totalRevenue} previousValue={kpis.previousRevenue} format="currency" icon={<DollarSign size={18} />} index={0} sparkData={revenueSparkData} />
        <KPICard title="Tổng chi phí" value={kpis.totalCosts} previousValue={kpis.previousCosts} format="currency" icon={<Wallet size={18} />} invertColors index={1} sparkData={costsSparkData} />
        <KPICard title="Lợi nhuận ròng" value={kpis.netProfit} previousValue={kpis.previousProfit} format="currency" icon={<TrendingUp size={18} />} index={2} sparkData={profitSparkData} />
        <KPICard title="Biên lợi nhuận" value={kpis.profitMargin} previousValue={kpis.previousMargin} format="percent" icon={<Percent size={18} />} index={3} sparkData={marginSparkData} />
      </KPIGrid>

      <div className="grid-2">
        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h2 className="dashboard-section-title">Doanh thu, chi phí, lợi nhuận</h2>
          <TrendBarChart data={trendData} />
        </section>

        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '280ms' }}>
          <h2 className="dashboard-section-title">Phân bổ chi phí</h2>
          <CostBreakdownChart data={breakdown} />
        </section>
      </div>

      <div className="grid-2">
        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '320ms' }}>
          <h2 className="dashboard-section-title">Tỷ lệ chi phí so với doanh thu</h2>
          <CostRevenueRatioChart costsByClassify={costsByClassifyMerged} trendData={trendData} />
        </section>

        <section className="dashboard-section animate-fade-up" style={{ animationDelay: '360ms' }}>
          <h2 className="dashboard-section-title">So sánh cùng kỳ năm trước</h2>
          <YoYComparisonChart currentData={trendData} previousData={previousTrendData} />
        </section>
      </div>

      <section className="dashboard-section animate-fade-up" style={{ animationDelay: '400ms' }}>
        <h2 className="dashboard-section-title">So sánh chi nhánh</h2>
        <ClinicComparisonTable data={comparison} />
      </section>
    </DashboardClient>
  )
}
