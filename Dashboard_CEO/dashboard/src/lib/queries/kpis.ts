import { createClient } from '@/lib/supabase/server'

export interface KPIData {
  totalRevenue: number
  totalCosts: number
  netProfit: number
  profitMargin: number
  previousRevenue: number
  previousCosts: number
}

export async function getKPIs(
  clinicId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<KPIData> {
  const supabase = await createClient()

  // Default to current month if no dates provided
  const now = new Date()
  const currentStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Previous period for comparison
  const daysDiff = currentEnd.getTime() - currentStart.getTime()
  const previousStart = new Date(currentStart.getTime() - daysDiff - 86400000)
  const previousEnd = new Date(currentStart.getTime() - 86400000)

  let currentRevenueQuery = supabase
    .from('revenue')
    .select('total')
    .gte('date', currentStart.toISOString().split('T')[0])
    .lte('date', currentEnd.toISOString().split('T')[0])

  let currentExpensesQuery = supabase
    .from('expenses')
    .select('amount')
    .gte('date', currentStart.toISOString().split('T')[0])
    .lte('date', currentEnd.toISOString().split('T')[0])

  let prevRevenueQuery = supabase
    .from('revenue')
    .select('total')
    .gte('date', previousStart.toISOString().split('T')[0])
    .lte('date', previousEnd.toISOString().split('T')[0])

  let prevExpensesQuery = supabase
    .from('expenses')
    .select('amount')
    .gte('date', previousStart.toISOString().split('T')[0])
    .lte('date', previousEnd.toISOString().split('T')[0])

  if (clinicId) {
    currentRevenueQuery = currentRevenueQuery.eq('clinic_id', clinicId)
    currentExpensesQuery = currentExpensesQuery.eq('clinic_id', clinicId)
    prevRevenueQuery = prevRevenueQuery.eq('clinic_id', clinicId)
    prevExpensesQuery = prevExpensesQuery.eq('clinic_id', clinicId)
  }

  const { data: currentRevenue } = await currentRevenueQuery.throwOnError()
  const { data: currentExpenses } = await currentExpensesQuery.throwOnError()
  const { data: prevRevenue } = await prevRevenueQuery.throwOnError()
  const { data: prevExpenses } = await prevExpensesQuery.throwOnError()

  // Calculate totals with type assertions
  const typedCurrentRevenue = currentRevenue as unknown as { total: number | null }[]
  const typedCurrentExpenses = currentExpenses as unknown as { amount: number | null }[]
  const typedPrevRevenue = prevRevenue as unknown as { total: number | null }[]
  const typedPrevExpenses = prevExpenses as unknown as { amount: number | null }[]

  const totalRevenue = typedCurrentRevenue?.reduce((sum, r) => sum + (r.total || 0), 0) || 0
  const totalCosts = typedCurrentExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
  const previousRevenue = typedPrevRevenue?.reduce((sum, r) => sum + (r.total || 0), 0) || 0
  const previousCosts = typedPrevExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

  const netProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalCosts,
    netProfit,
    profitMargin,
    previousRevenue,
    previousCosts,
  }
}

// Re-export client-safe formatting utilities for backward compatibility
export { formatCurrency, formatPercent, calculateChange } from '@/lib/format'

