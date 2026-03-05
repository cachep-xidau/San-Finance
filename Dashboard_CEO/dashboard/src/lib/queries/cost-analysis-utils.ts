// Shared types and utils for cost analysis (client-safe, no server imports)
import type { CostByClassify } from './cost-analysis-types'

export type { CostByClassify }

export interface CostGroup {
    finance: string
    items: CostByClassify[]
    total: number
}

/** Group flat classify items by their finance (master data) parent */
export function groupByFinance(items: CostByClassify[]): CostGroup[] {
    const map = new Map<string, CostByClassify[]>()
    for (const item of items) {
        const key = item.finance
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(item)
    }

    return Array.from(map.entries())
        .map(([finance, items]) => ({
            finance,
            items: items.sort((a, b) => b.total - a.total),
            total: items.reduce((s, i) => s + i.total, 0),
        }))
        .sort((a, b) => {
            const ai = parseInt(a.finance.charAt(0)) || 99
            const bi = parseInt(b.finance.charAt(0)) || 99
            return ai - bi
        })
}
