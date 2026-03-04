import { getRawRevenue, getLastSync } from '@/lib/queries/raw-data'
import { RevenuePageClient } from '@/components/data/revenue-page-client'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
    const [revenueData, lastSync] = await Promise.all([
        getRawRevenue(),
        getLastSync(),
    ])

    return <RevenuePageClient data={revenueData} lastSync={lastSync} />
}
