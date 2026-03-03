import { createClient } from '@/lib/supabase/server'

export interface Budget {
  id: string
  clinic_id: string
  category_id: string
  year: number
  month: number | null
  amount: number
  created_at: string
}

export interface BudgetWithDetails extends Budget {
  clinic_name: string
  category_name: string
  category_code: string
  category_parent?: string
}

export interface BudgetVariance {
  category: string
  budget: number
  actual: number
  variance: number
  variance_pct: number
  status: 'ok' | 'warning' | 'critical'
}

export async function getBudgets(
  clinicId?: string,
  year?: number,
  month?: number
): Promise<BudgetWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('budgets')
    .select(`
      id,
      clinic_id,
      category_id,
      year,
      month,
      amount,
      created_at,
      clinics (name),
      categories (name, code)
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (clinicId) {
    query = query.eq('clinic_id', clinicId)
  }
  if (year) {
    query = query.eq('year', year)
  }
  if (month !== undefined) {
    query = query.eq('month', month)
  }

  const { data, error } = await query.throwOnError()
  if (error) throw error

  // Transform to BudgetWithDetails
  const typedData = data as unknown as Array<{
    id: string
    clinic_id: string
    category_id: string
    year: number
    month: number | null
    amount: number
    created_at: string
    clinics: { name: string } | null
    categories: { name: string; code: string } | null
  }>

  return typedData.map((b) => ({
    id: b.id,
    clinic_id: b.clinic_id,
    category_id: b.category_id,
    year: b.year,
    month: b.month,
    amount: b.amount,
    created_at: b.created_at,
    clinic_name: b.clinics?.name || 'Unknown',
    category_name: b.categories?.name || 'Unknown',
    category_code: b.categories?.code || '',
  }))
}

export async function createBudget(budget: {
  clinic_id: string
  category_id: string
  year: number
  month: number | null
  amount: number
}): Promise<Budget> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budgets')
    .insert(budget as never)
    .select()
    .single()
    .throwOnError()

  if (error) throw error
  return data as unknown as Budget
}

export async function updateBudget(
  id: string,
  updates: Partial<{
    clinic_id: string
    category_id: string
    year: number
    month: number | null
    amount: number
  }>
): Promise<Budget> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budgets')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single()
    .throwOnError()

  if (error) throw error
  return data as unknown as Budget
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .throwOnError()

  if (error) throw error
}

export async function getBudgetVariance(
  clinicId: string,
  year: number,
  month: number
): Promise<BudgetVariance[]> {
  const supabase = await createClient()

  // Get budgets for the period
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select(`
      id,
      category_id,
      amount,
      categories (name, parent_category)
    `)
    .eq('clinic_id', clinicId)
    .eq('year', year)
    .eq('month', month)
    .throwOnError()

  if (budgetError) throw budgetError

  if (!budgets || budgets.length === 0) {
    return []
  }

  // Get expenses for the period
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const { data: expenses, error: expenseError } = await supabase
    .from('expenses')
    .select('category_id, amount')
    .eq('clinic_id', clinicId)
    .gte('date', startDate)
    .lte('date', endDate)
    .throwOnError()

  if (expenseError) throw expenseError

  // Calculate actuals per category
  const actualsByCategory: Record<string, number> = {}
  const typedExpenses = expenses as unknown as Array<{ category_id: string; amount: number | null }>
  for (const expense of typedExpenses) {
    actualsByCategory[expense.category_id] = (actualsByCategory[expense.category_id] || 0) + (expense.amount || 0)
  }

  // Calculate variance
  const typedBudgets = budgets as unknown as Array<{
    id: string
    category_id: string
    amount: number
    categories: { name: string; parent_category: string | null } | null
  }>

  return typedBudgets.map((b) => {
    const actual = actualsByCategory[b.category_id] || 0
    const variance = actual - b.amount
    const variancePct = b.amount > 0 ? (variance / b.amount) * 100 : 0

    let status: 'ok' | 'warning' | 'critical' = 'ok'
    if (Math.abs(variancePct) > 20) {
      status = 'critical'
    } else if (Math.abs(variancePct) > 10) {
      status = 'warning'
    }

    // Get short category name
    const fullName = b.categories?.name || 'Unknown'
    const shortName = b.categories?.parent_category?.split('. ')[1] || fullName

    return {
      category: shortName,
      budget: b.amount,
      actual,
      variance,
      variance_pct: variancePct,
      status,
    }
  })
}

export async function upsertBudget(budget: {
  clinic_id: string
  category_id: string
  year: number
  month: number | null
  amount: number
}): Promise<Budget> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget as never, {
      onConflict: 'clinic_id,category_id,year,month',
    })
    .select()
    .single()
    .throwOnError()

  if (error) throw error
  return data as unknown as Budget
}
