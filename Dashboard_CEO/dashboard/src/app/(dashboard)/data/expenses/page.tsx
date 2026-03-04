import { getRawExpenses, getLastSync, getExpenseFilterOptions } from '@/lib/queries/raw-data'
import { ExpensesPageClient } from '@/components/data/expenses-page-client'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
    const [expenseData, lastSync, filterOpts] = await Promise.all([
        getRawExpenses(),
        getLastSync(),
        getExpenseFilterOptions(),
    ])

    return (
        <ExpensesPageClient
            data={expenseData}
            lastSync={lastSync}
            financeOptions={filterOpts.financeOptions}
            classifyOptions={filterOpts.classifyOptions}
        />
    )
}
