import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────

export interface MasterDataRow {
    id: number
    code: string
    classify: string
    category: string
    expense_type: string
}

export interface RawRevenueRow {
    id: number
    clinic: string
    month: string
    date: string
    cash: number
    card: number
    card_net: number
    transfer: number
    installment: number
    deposit: number
    total: number
    total_net: number
}

export interface RawExpenseRow {
    id: number
    clinic: string
    month: string
    description: string
    classify: string
    amount: number
    cash_flow: string
    finance: string
}

// ── Queries ──────────────────────────────────────

export async function getMasterData(): Promise<MasterDataRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('master_data')
        .select('*')
        .order('code')

    if (error) throw error
    return (data as unknown as MasterDataRow[]) || []
}

export async function getRawRevenue(clinic?: string): Promise<RawRevenueRow[]> {
    const supabase = await createClient()
    let query = supabase
        .from('raw_revenue')
        .select('*')
        .gt('total', 0)
        .order('month', { ascending: false })
        .order('date', { ascending: false })

    if (clinic) {
        query = query.eq('clinic', clinic)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as unknown as RawRevenueRow[]) || []
}

export async function getRawExpenses(clinic?: string): Promise<RawExpenseRow[]> {
    const supabase = await createClient()
    let query = supabase
        .from('raw_expenses')
        .select('*')
        .gt('amount', 0)
        .order('month', { ascending: false })

    if (clinic) {
        query = query.eq('clinic', clinic)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as unknown as RawExpenseRow[]) || []
}

// ── Stats ────────────────────────────────────────

export async function getDataStats() {
    const supabase = await createClient()

    const [{ count: revenueCount }, { count: expenseCount }, { count: masterCount }] =
        await Promise.all([
            supabase.from('raw_revenue').select('*', { count: 'exact', head: true }).gt('total', 0),
            supabase.from('raw_expenses').select('*', { count: 'exact', head: true }).gt('amount', 0),
            supabase.from('master_data').select('*', { count: 'exact', head: true }),
        ])

    return {
        revenueCount: revenueCount || 0,
        expenseCount: expenseCount || 0,
        masterCount: masterCount || 0,
    }
}

export async function getLastSync(): Promise<string | null> {
    const supabase = await createClient()
    const { data } = await (supabase as any)
        .from('sync_logs')
        .select('completed_at')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
    return data?.completed_at || null
}

export async function getExpenseFilterOptions(): Promise<{ financeOptions: string[]; classifyOptions: string[] }> {
    const supabase = await createClient()
    const { data: financeRows } = await supabase
        .from('raw_expenses')
        .select('finance')
        .gt('amount', 0)
    const { data: classifyRows } = await supabase
        .from('raw_expenses')
        .select('classify')
        .gt('amount', 0)

    const financeOptions = [...new Set((financeRows as unknown as { finance: string }[] || []).map(r => r.finance).filter(Boolean))].sort()
    const classifyOptions = [...new Set((classifyRows as unknown as { classify: string }[] || []).map(r => r.classify).filter(Boolean))].sort()

    return { financeOptions, classifyOptions }
}

