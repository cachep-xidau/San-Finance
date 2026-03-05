import { createClient } from '@/lib/supabase/server'

export interface KPIData {
  totalRevenue: number
  totalCosts: number
  netProfit: number
  profitMargin: number
  previousRevenue: number
  previousCosts: number
  previousProfit: number
  previousMargin: number
}

function dateToMonth(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getKPIs(
  clinicId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<KPIData> {
  const supabase = await createClient()

  const now = new Date()
  const currentStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Build month range: e.g. "2026.01" to "2026.03"
  const startMonth = dateToMonth(currentStart)
  const endMonth = dateToMonth(currentEnd)

  // Previous period (same duration, shifted back)
  const daysDiff = currentEnd.getTime() - currentStart.getTime()
  const prevEnd = new Date(currentStart.getTime() - 86400000)
  const prevStart = new Date(prevEnd.getTime() - daysDiff)
  const prevStartMonth = dateToMonth(prevStart)
  const prevEndMonth = dateToMonth(prevEnd)

  // Current revenue
  let revQ = supabase.from('raw_revenue').select('total').gte('month', startMonth).lte('month', endMonth).gt('total', 0)
  if (clinicId) revQ = revQ.eq('clinic', clinicId)
  const { data: revData } = await revQ

  // Current expenses
  let expQ = supabase.from('raw_expenses').select('amount').gte('month', startMonth).lte('month', endMonth).gt('amount', 0)
  if (clinicId) expQ = expQ.eq('clinic', clinicId)
  const { data: expData } = await expQ

  // Previous revenue
  let prevRevQ = supabase.from('raw_revenue').select('total').gte('month', prevStartMonth).lte('month', prevEndMonth).gt('total', 0)
  if (clinicId) prevRevQ = prevRevQ.eq('clinic', clinicId)
  const { data: prevRevData } = await prevRevQ

  // Previous expenses
  let prevExpQ = supabase.from('raw_expenses').select('amount').gte('month', prevStartMonth).lte('month', prevEndMonth).gt('amount', 0)
  if (clinicId) prevExpQ = prevExpQ.eq('clinic', clinicId)
  const { data: prevExpData } = await prevExpQ

  const totalRevenue = (revData as any[])?.reduce((s, r) => s + (r.total || 0), 0) || 0
  const totalCosts = (expData as any[])?.reduce((s, r) => s + (r.amount || 0), 0) || 0
  const previousRevenue = (prevRevData as any[])?.reduce((s, r) => s + (r.total || 0), 0) || 0
  const previousCosts = (prevExpData as any[])?.reduce((s, r) => s + (r.amount || 0), 0) || 0

  const netProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const previousProfit = previousRevenue - previousCosts
  const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0

  return { totalRevenue, totalCosts, netProfit, profitMargin, previousRevenue, previousCosts, previousProfit, previousMargin }
}

export { formatCurrency, formatPercent, calculateChange } from '@/lib/format'
