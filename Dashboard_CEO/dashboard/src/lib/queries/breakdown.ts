import { createClient } from '@/lib/supabase/server'

export interface BreakdownDataPoint {
  category: string
  amount: number
  percentage: number
}

// Type for the query result with joined categories
interface ExpenseWithCategory {
  amount: number | null
  categories: { parent_category: string | null } | null
}

export async function getCostBreakdown(
  clinicId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<BreakdownDataPoint[]> {
  const supabase = await createClient()

  // Default to current month
  const now = new Date()
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Fetch expenses with categories
  let query = supabase
    .from('expenses')
    .select(`
      amount,
      categories (
        parent_category
      )
    `)
    .gte('date', start.toISOString().split('T')[0])
    .lte('date', end.toISOString().split('T')[0])

  if (clinicId) {
    query = query.eq('clinic_id', clinicId)
  }

  const { data: expenses } = await query.throwOnError()

  if (!expenses || expenses.length === 0) {
    return []
  }

  // Cast to our type
  const typedExpenses = expenses as unknown as ExpenseWithCategory[]

  // Group by parent category
  const categoryTotals: Record<string, number> = {}
  let total = 0

  for (const expense of typedExpenses) {
    const category = expense.categories?.parent_category || 'Khác'
    const shortCategory = category.split('. ')[1] || category // Remove "1. " prefix
    categoryTotals[shortCategory] = (categoryTotals[shortCategory] || 0) + (expense.amount || 0)
    total += expense.amount || 0
  }

  // Convert to array and calculate percentages
  const result: BreakdownDataPoint[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return result
}

// Chart colors for categories
export const CATEGORY_COLORS: Record<string, string> = {
  'Giá vốn hàng bán': '#3B82F6',
  'Chi phí bán hàng': '#10B981',
  'Chi phí quản lý doanh nghiệp': '#F59E0B',
  'Chi phí nhân sự': '#8B5CF6',
  'Chi phí thuế và lãi vay': '#EF4444',
  'Chi phí khác': '#6B7280',
}
