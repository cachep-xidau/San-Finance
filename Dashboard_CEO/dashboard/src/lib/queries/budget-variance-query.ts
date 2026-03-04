import { createClient } from '@/lib/supabase/server'
import {
  buildBudgetVariance,
  type BudgetVariance,
  type BudgetVarianceBudgetRow,
  type BudgetVarianceExpenseRow,
} from './budget-variance-calculation'

export async function getBudgetVariance(
  clinicId: string | null,
  year: number,
  month: number
): Promise<BudgetVariance[]> {
  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  let budgetQuery = supabase
    .from('budgets')
    .select(`
      id,
      category_id,
      amount,
      categories (name, parent_category)
    `)
    .eq('year', year)
    .eq('month', month)

  if (clinicId) {
    budgetQuery = budgetQuery.eq('clinic_id', clinicId)
  }

  const { data: budgets, error: budgetError } = await budgetQuery.throwOnError()
  if (budgetError) throw budgetError

  if (!budgets || budgets.length === 0) {
    return []
  }

  let expenseQuery = supabase
    .from('expenses')
    .select('category_id, amount')
    .gte('date', startDate)
    .lte('date', endDate)

  if (clinicId) {
    expenseQuery = expenseQuery.eq('clinic_id', clinicId)
  }

  const { data: expenses, error: expenseError } = await expenseQuery.throwOnError()
  if (expenseError) throw expenseError

  const typedExpenses = expenses as unknown as BudgetVarianceExpenseRow[]
  const typedBudgets = budgets as unknown as BudgetVarianceBudgetRow[]

  return buildBudgetVariance(typedBudgets, typedExpenses)
}
