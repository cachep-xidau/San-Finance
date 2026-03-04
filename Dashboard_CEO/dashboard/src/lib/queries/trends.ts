import { createClient } from '@/lib/supabase/server'

export interface TrendDataPoint {
  month: string
  monthLabel: string
  revenue: number
  costs: number
  profit: number
}

export async function getTrendData(
  clinicId?: string,
  months: number = 12
): Promise<TrendDataPoint[]> {
  const supabase = await createClient()
  const data: TrendDataPoint[] = []

  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthStr = monthDate.toISOString().slice(0, 7) // YYYY-MM
    const monthLabel = monthDate.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })

    // Fetch revenue for this month
    let revenueQuery = supabase
      .from('revenue')
      .select('total')
      .gte('date', monthDate.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0])

    if (clinicId) {
      revenueQuery = revenueQuery.eq('clinic_id', clinicId)
    }

    const { data: revenueData } = await revenueQuery.throwOnError()

    // Fetch expenses for this month
    let expenseQuery = supabase
      .from('expenses')
      .select('amount')
      .gte('date', monthDate.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0])

    if (clinicId) {
      expenseQuery = expenseQuery.eq('clinic_id', clinicId)
    }

    const { data: expenseData } = await expenseQuery.throwOnError()

    // Type assertions
    const typedRevenue = revenueData as unknown as { total: number | null }[]
    const typedExpenses = expenseData as unknown as { amount: number | null }[]

    const revenue = typedRevenue?.reduce((sum, r) => sum + (r.total || 0), 0) || 0
    const costs = typedExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    data.push({
      month: monthStr,
      monthLabel,
      revenue,
      costs,
      profit: revenue - costs,
    })
  }

  return data
}
