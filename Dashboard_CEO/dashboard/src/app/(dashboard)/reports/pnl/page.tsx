import { getPnLReport } from '@/lib/queries/pnl-report'
import { getAvailableYears } from '@/lib/queries/expense-report'
import { PnLReportClient } from '@/components/reports/pnl-report-client'

export const dynamic = 'force-dynamic'

export default async function PnLReportPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; clinic?: string }>
}) {
    const params = await searchParams
    const availableYears = await getAvailableYears()
    const currentYear = new Date().getFullYear()
    const year = params.year ? parseInt(params.year) : currentYear
    const clinic = params.clinic || undefined

    const [report, prevYearReport, allReport, sanReport, teennieReport, implantReport] = await Promise.all([
        getPnLReport(year, clinic),
        getPnLReport(year - 1, clinic),
        getPnLReport(year),
        getPnLReport(year, 'San'),
        getPnLReport(year, 'Teennie'),
        getPnLReport(year, 'Implant'),
    ])

    // Clinic totals = revenue (section 0)
    const getRevenue = (r: typeof report) => r.sections[0]?.total || 0

    const clinicTotals = {
        all: getRevenue(allReport),
        San: getRevenue(sanReport),
        Teennie: getRevenue(teennieReport),
        Implant: getRevenue(implantReport),
    }

    return (
        <PnLReportClient
            report={report}
            prevYearReport={prevYearReport}
            availableYears={availableYears}
            selectedYear={year}
            selectedClinic={clinic || null}
            clinicTotals={clinicTotals}
        />
    )
}
