import { getExpenseReport, getAvailableYears } from '@/lib/queries/expense-report'
import { getCostsByClassify } from '@/lib/queries/cost-analysis'
import { ExpenseReportClient } from '@/components/reports/expense-report-client'

export const dynamic = 'force-dynamic'

export default async function ExpenseReportPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; clinic?: string }>
}) {
    const params = await searchParams
    const availableYears = await getAvailableYears()
    const currentYear = new Date().getFullYear()
    const year = params.year ? parseInt(params.year) : currentYear
    const clinic = params.clinic || undefined

    // Fetch report for selected clinic and also all clinics for card totals
    const [report, allReport, sanReport, teennieReport, implantReport, prevYearReport, costsByClassify] = await Promise.all([
        getExpenseReport(year, clinic),
        getExpenseReport(year),
        getExpenseReport(year, 'San'),
        getExpenseReport(year, 'Teennie'),
        getExpenseReport(year, 'Implant'),
        getExpenseReport(year - 1, clinic),
        getCostsByClassify(year, clinic),
    ])

    const clinicTotals = {
        all: allReport.grandTotalYear,
        San: sanReport.grandTotalYear,
        Teennie: teennieReport.grandTotalYear,
        Implant: implantReport.grandTotalYear,
    }

    return (
        <ExpenseReportClient
            report={report}
            prevYearReport={prevYearReport}
            availableYears={availableYears}
            selectedYear={year}
            selectedClinic={clinic || null}
            clinicTotals={clinicTotals}
            costsByClassify={costsByClassify}
        />
    )
}
