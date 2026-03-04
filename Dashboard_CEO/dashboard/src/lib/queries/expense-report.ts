import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────

export interface ExpenseReportRow {
    category: string       // e.g. "1. Giá vốn hàng bán"
    classify: string       // e.g. "Vật tư nha khoa..."
    expense_type: string   // "Biến phí" | "Định phí"
    months: Record<string, number>  // { "01": 100000, "02": 200000, ... }
    total: number
}

export interface ExpenseReportData {
    year: number
    clinic: string | null
    categories: {
        name: string
        items: ExpenseReportRow[]
        subtotal: Record<string, number>
        subtotalYear: number
    }[]
    grandTotal: Record<string, number>
    grandTotalYear: number
    monthsWithData: string[]
    quartersWithData: string[]
}

// ── Query ────────────────────────────────────────

export async function getExpenseReport(year: number, clinic?: string): Promise<ExpenseReportData> {
    const supabase = await createClient()

    const monthPrefix = `${year}.`
    let query = supabase
        .from('raw_expenses')
        .select('classify, finance, cash_flow, amount, month')
        .gt('amount', 0)
        .like('month', `${monthPrefix}%`)

    if (clinic) {
        query = query.eq('clinic', clinic)
    }

    const { data: expenses, error } = await query
    if (error) throw error

    // Build aggregation: category → classify → month totals
    const agg = new Map<string, Map<string, { expenseType: string; months: Record<string, number> }>>()

    for (const row of (expenses || []) as { classify: string; finance: string; cash_flow: string; amount: number; month: string }[]) {
        const category = row.finance || 'Chưa phân loại'
        const classify = row.classify || 'Khác'
        const month = row.month.replace(monthPrefix, '') // "01", "02", etc.

        if (!agg.has(category)) agg.set(category, new Map())
        const catMap = agg.get(category)!

        if (!catMap.has(classify)) {
            catMap.set(classify, { expenseType: row.cash_flow || '', months: {} })
        }
        const item = catMap.get(classify)!
        item.months[month] = (item.months[month] || 0) + row.amount
    }

    // Convert to structured output
    const allMonths = new Set<string>()
    const categories = [...agg.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([catName, catMap]) => {
            const items: ExpenseReportRow[] = [...catMap.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([classify, data]) => {
                    Object.keys(data.months).forEach(m => allMonths.add(m))
                    const total = Object.values(data.months).reduce((s, v) => s + v, 0)
                    return { category: catName, classify, expense_type: data.expenseType, months: data.months, total }
                })

            // Category subtotals per month
            const subtotal: Record<string, number> = {}
            let subtotalYear = 0
            for (const item of items) {
                for (const [m, v] of Object.entries(item.months)) {
                    subtotal[m] = (subtotal[m] || 0) + v
                }
                subtotalYear += item.total
            }

            return { name: catName, items, subtotal, subtotalYear }
        })

    // Grand totals
    const grandTotal: Record<string, number> = {}
    let grandTotalYear = 0
    for (const cat of categories) {
        for (const [m, v] of Object.entries(cat.subtotal)) {
            grandTotal[m] = (grandTotal[m] || 0) + v
        }
        grandTotalYear += cat.subtotalYear
    }

    const monthsWithData = [...allMonths].sort()
    const quartersWithData = [...new Set(monthsWithData.map(m => {
        const n = parseInt(m)
        return `Q${Math.ceil(n / 3)}`
    }))].sort()

    return {
        year,
        clinic: clinic || null,
        categories,
        grandTotal,
        grandTotalYear,
        monthsWithData,
        quartersWithData,
    }
}

// ── Available years ──────────────────────────────

export async function getAvailableYears(): Promise<number[]> {
    const supabase = await createClient()

    // Paginate to ensure we scan ALL rows, not just the default 1000
    const PAGE_SIZE = 1000
    const years = new Set<number>()
    let from = 0
    let hasMore = true

    while (hasMore) {
        const { data } = await supabase
            .from('raw_expenses')
            .select('month')
            .gt('amount', 0)
            .range(from, from + PAGE_SIZE - 1)

        const rows = (data || []) as { month: string }[]
        for (const row of rows) {
            const y = parseInt(row.month.split('.')[0])
            if (!isNaN(y)) years.add(y)
        }

        hasMore = rows.length === PAGE_SIZE
        from += PAGE_SIZE
    }

    return [...years].sort((a, b) => a - b)
}
