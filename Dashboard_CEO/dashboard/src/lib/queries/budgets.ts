import { createClient } from '@/lib/supabase/server'

export { getBudgetVariance } from './budget-variance-query'
export type { BudgetVariance } from './budget-variance-calculation'

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

  if (clinicId) query = query.eq('clinic_id', clinicId)
  if (year) query = query.eq('year', year)
  if (month !== undefined) query = query.eq('month', month)

  const { data, error } = await query.throwOnError()
  if (error) throw error

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
