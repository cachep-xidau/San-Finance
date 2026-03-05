import { createClient } from '@/lib/supabase/server'

export interface BreakdownDataPoint {
  category: string
  amount: number
  percentage: number
}

function dateToMonth(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getCostBreakdown(
  clinicId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<BreakdownDataPoint[]> {
  const supabase = await createClient()

  const now = new Date()
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startMonth = dateToMonth(start)
  const endMonth = dateToMonth(end)

  let query = supabase
    .from('raw_expenses')
    .select('finance, amount')
    .gte('month', startMonth)
    .lte('month', endMonth)
    .gt('amount', 0)

  if (clinicId) {
    query = query.eq('clinic', clinicId)
  }

  const { data: expenses } = await query

  if (!expenses || expenses.length === 0) return []

  const categoryTotals: Record<string, number> = {}
  let total = 0

  for (const exp of expenses as any[]) {
    const finance = exp.finance || 'Chưa phân loại'
    const shortName = finance.replace(/^\d+\.\s*/, '')
    categoryTotals[shortName] = (categoryTotals[shortName] || 0) + (exp.amount || 0)
    total += exp.amount || 0
  }

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Giá vốn hàng bán': '#3B82F6',
  'Chi phí bán hàng': '#10B981',
  'Chi phí quản lý doanh nghiệp': '#F59E0B',
  'Chi phí nhân sự': '#8B5CF6',
  'Chi phí thuế và lãi vay': '#EF4444',
  'Chi phí khác': '#6B7280',
}
