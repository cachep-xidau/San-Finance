import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────

export interface PnLLineItem {
    classify: string
    months: Record<string, number>
    total: number
}

export interface PnLSection {
    key: string
    label: string
    type: 'data' | 'computed'
    months: Record<string, number>
    total: number
    items?: PnLLineItem[]  // sub-items for expandable sections
}

export interface PnLReportData {
    year: number
    clinic: string | null
    sections: PnLSection[]
    monthsWithData: string[]
    quartersWithData: string[]
}

// ── Mapping ──────────────────────────────────────

// Map raw_expenses.finance prefixes to P&L line keys
const FINANCE_TO_PNL: Record<string, string> = {
    '1': 'cogs',       // Giá vốn hàng bán
    '2': 'selling',    // Chi phí bán hàng
    '3': 'admin',      // Chi phí QLDN
    '4': 'staff',      // Chi phí nhân sự → mapped to "other expenses"
    '5': 'tax',        // Thuế và lãi vay
    '6': 'other_exp',  // Chi phí khác
}

function getFinanceKey(finance: string): string {
    const num = finance.match(/^(\d+)/)?.[1]
    return num ? (FINANCE_TO_PNL[num] || 'other_exp') : 'other_exp'
}

// ── Helper: aggregate months ─────────────────────

function addMonths(target: Record<string, number>, source: Record<string, number>) {
    for (const [m, v] of Object.entries(source)) {
        target[m] = (target[m] || 0) + v
    }
}

function subtractMonths(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = { ...a }
    for (const [m, v] of Object.entries(b)) {
        result[m] = (result[m] || 0) - v
    }
    return result
}

function sumMonths(months: Record<string, number>): number {
    return Object.values(months).reduce((s, v) => s + v, 0)
}

// ── Query ────────────────────────────────────────

export async function getPnLReport(year: number, clinic?: string): Promise<PnLReportData> {
    const supabase = await createClient()
    const monthPrefix = `${year}.`

    // 1. Fetch revenue — paginate
    const revenue: Record<string, number> = {}
    let from = 0
    const PAGE = 1000
    while (true) {
        let q = supabase
            .from('raw_revenue')
            .select('month, total')
            .like('month', `${monthPrefix}%`)
            .gt('total', 0)
            .range(from, from + PAGE - 1)
        if (clinic) q = q.eq('clinic', clinic)
        const { data } = await q
        const rows = (data || []) as { month: string; total: number }[]
        for (const r of rows) {
            const m = r.month.replace(monthPrefix, '')
            revenue[m] = (revenue[m] || 0) + r.total
        }
        if (rows.length < PAGE) break
        from += PAGE
    }

    // 2. Fetch expenses — paginate
    type ExpRow = { classify: string; finance: string; amount: number; month: string }
    const expensesByKey = new Map<string, { label: string; items: Map<string, Record<string, number>>; months: Record<string, number> }>()

    from = 0
    while (true) {
        let q = supabase
            .from('raw_expenses')
            .select('classify, finance, amount, month')
            .gt('amount', 0)
            .like('month', `${monthPrefix}%`)
            .range(from, from + PAGE - 1)
        if (clinic) q = q.eq('clinic', clinic)
        const { data } = await q
        const rows = (data || []) as ExpRow[]
        for (const r of rows) {
            const key = getFinanceKey(r.finance)
            const m = r.month.replace(monthPrefix, '')
            const classify = r.classify || 'Khác'

            if (!expensesByKey.has(key)) {
                expensesByKey.set(key, { label: r.finance, items: new Map(), months: {} })
            }
            const bucket = expensesByKey.get(key)!
            bucket.months[m] = (bucket.months[m] || 0) + r.amount

            if (!bucket.items.has(classify)) bucket.items.set(classify, {})
            const itemMonths = bucket.items.get(classify)!
            itemMonths[m] = (itemMonths[m] || 0) + r.amount
        }
        if (rows.length < PAGE) break
        from += PAGE
    }

    // 3. Build P&L sections
    const getExpense = (key: string): { months: Record<string, number>; items: PnLLineItem[] } => {
        const bucket = expensesByKey.get(key)
        if (!bucket) return { months: {}, items: [] }
        const items = [...bucket.items.entries()]
            .map(([classify, months]) => ({ classify, months, total: sumMonths(months) }))
            .sort((a, b) => b.total - a.total)
        return { months: { ...bucket.months }, items }
    }

    const rev = { months: revenue, total: sumMonths(revenue) }
    const cogs = getExpense('cogs')
    const selling = getExpense('selling')
    const admin = getExpense('admin')
    const staff = getExpense('staff')
    const tax = getExpense('tax')
    const otherExp = getExpense('other_exp')

    // Merge staff into admin for P&L display (or keep separate as "other costs")
    // Chi phí nhân sự goes into "Các loại chi phí khác" along with category 6
    const otherCosts: { months: Record<string, number>; items: PnLLineItem[] } = {
        months: { ...staff.months },
        items: [...staff.items, ...otherExp.items],
    }
    addMonths(otherCosts.months, otherExp.months)

    // Computed rows
    const grossProfit = subtractMonths(rev.months, cogs.months)
    const finIncome: Record<string, number> = {}  // Doanh thu tài chính = 0 for now
    const finExpense: Record<string, number> = {} // Chi phí tài chính = 0 for now
    const netProfit = subtractMonths(
        Object.entries(grossProfit).reduce((acc, [m, v]) => { acc[m] = v + (finIncome[m] || 0) - (finExpense[m] || 0); return acc }, {} as Record<string, number>),
        {} // already computed inline
    )
    // Recalculate properly
    const netProfitMonths: Record<string, number> = {}
    const allMonthKeys = new Set([...Object.keys(rev.months), ...Object.keys(cogs.months)])
    for (const m of allMonthKeys) {
        netProfitMonths[m] = (grossProfit[m] || 0) + (finIncome[m] || 0) - (finExpense[m] || 0)
    }

    const opProfitMonths: Record<string, number> = {}
    for (const m of allMonthKeys) {
        opProfitMonths[m] = (netProfitMonths[m] || 0) - (selling.months[m] || 0)
    }

    const otherIncome: Record<string, number> = {}
    const otherIncomeCost: Record<string, number> = {}

    const preTaxMonths: Record<string, number> = {}
    for (const m of allMonthKeys) {
        preTaxMonths[m] = (opProfitMonths[m] || 0) - (admin.months[m] || 0) - (otherCosts.months[m] || 0) + (otherIncome[m] || 0) - (otherIncomeCost[m] || 0)
    }

    const retainedMonths: Record<string, number> = {}
    for (const m of allMonthKeys) {
        retainedMonths[m] = (preTaxMonths[m] || 0) - (tax.months[m] || 0)
    }

    const sections: PnLSection[] = [
        { key: 'revenue', label: '1. Doanh thu thuần từ hoạt động kinh doanh', type: 'data', months: rev.months, total: sumMonths(rev.months) },
        { key: 'cogs', label: '2. Giá vốn hàng bán', type: 'data', months: cogs.months, total: sumMonths(cogs.months), items: cogs.items },
        { key: 'gross_profit', label: '3. Lãi gộp', type: 'computed', months: grossProfit, total: sumMonths(grossProfit) },
        { key: 'fin_income', label: '4. Doanh thu tài chính', type: 'data', months: finIncome, total: 0 },
        { key: 'fin_expense', label: '5. Chi phí tài chính', type: 'data', months: finExpense, total: 0 },
        { key: 'net_profit', label: '6. Lợi nhuận thuần', type: 'computed', months: netProfitMonths, total: sumMonths(netProfitMonths) },
        { key: 'selling', label: '7. Chi phí bán hàng', type: 'data', months: selling.months, total: sumMonths(selling.months), items: selling.items },
        { key: 'op_profit', label: '8. Lợi nhuận kinh doanh', type: 'computed', months: opProfitMonths, total: sumMonths(opProfitMonths) },
        { key: 'admin', label: '9. Chi phí quản lý doanh nghiệp', type: 'data', months: admin.months, total: sumMonths(admin.months), items: admin.items },
        { key: 'other_costs', label: '10. Các loại chi phí khác', type: 'data', months: otherCosts.months, total: sumMonths(otherCosts.months), items: otherCosts.items },
        { key: 'other_income', label: '11. Thu nhập khác', type: 'data', months: otherIncome, total: 0 },
        { key: 'other_income_cost', label: '12. Chi phí của thu nhập khác', type: 'data', months: otherIncomeCost, total: 0 },
        { key: 'pre_tax', label: '13. Lợi nhuận kế toán trước thuế', type: 'computed', months: preTaxMonths, total: sumMonths(preTaxMonths) },
        { key: 'tax', label: '14. Thuế và lãi vay phải nộp', type: 'data', months: tax.months, total: sumMonths(tax.months), items: tax.items },
        { key: 'retained', label: '15. Lợi nhuận chưa phân phối', type: 'computed', months: retainedMonths, total: sumMonths(retainedMonths) },
    ]

    const monthsWithData = [...allMonthKeys].sort()
    const quartersWithData = [...new Set(monthsWithData.map(m => `Q${Math.ceil(parseInt(m) / 3)}`))].sort()

    return { year, clinic: clinic || null, sections, monthsWithData, quartersWithData }
}
