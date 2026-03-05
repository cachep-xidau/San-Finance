import { createClient } from '@/lib/supabase/server'
import type { CostByClassify } from './cost-analysis-types'

export type { CostByClassify }
export type { CostGroup } from './cost-analysis-utils'
export { groupByFinance } from './cost-analysis-utils'

export async function getCostsByClassify(year: number, clinic?: string): Promise<CostByClassify[]> {
    const supabase = await createClient()
    const prefix = `${year}.`

    let allRows: { classify: string; finance: string; amount: number; month: string }[] = []
    let from = 0
    const pageSize = 1000

    while (true) {
        let q = supabase
            .from('raw_expenses')
            .select('classify, finance, amount, month')
            .like('month', `${prefix}%`)
            .gt('amount', 0)
            .range(from, from + pageSize - 1)
        if (clinic) q = q.eq('clinic', clinic)
        const { data } = await q
        if (!data || data.length === 0) break
        allRows = allRows.concat(data as any[])
        if (data.length < pageSize) break
        from += pageSize
    }

    // Group by classify
    const map = new Map<string, { finance: string; months: Record<string, number>; total: number }>()

    for (const row of allRows) {
        const c = row.classify || 'Chưa phân loại'
        const mm = row.month.split('.')[1]
        if (!map.has(c)) map.set(c, { finance: row.finance || 'Khác', months: {}, total: 0 })
        const entry = map.get(c)!
        entry.months[mm] = (entry.months[mm] || 0) + row.amount
        entry.total += row.amount
    }

    return Array.from(map.entries())
        .map(([classify, data]) => ({ classify, ...data }))
        .sort((a, b) => b.total - a.total)
}
