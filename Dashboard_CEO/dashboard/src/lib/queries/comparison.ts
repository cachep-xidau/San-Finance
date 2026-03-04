import { createClient } from '@/lib/supabase/server'

export interface ClinicComparison {
  clinicId: string
  clinicName: string
  clinicSlug: string
  revenue: number
  costs: number
  profit: number
  margin: number
}

interface ClinicRow {
  id: string
  name: string
  slug: string
}

export async function getClinicComparison(
  startDate?: Date,
  endDate?: Date
): Promise<ClinicComparison[]> {
  const supabase = await createClient()

  // Get all clinics
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, slug')
    .order('name')
    .throwOnError()

  if (!clinics || clinics.length === 0) {
    return []
  }

  // Cast to our type
  const typedClinics = clinics as unknown as ClinicRow[]

  // Default to current month
  const now = new Date()
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const results: ClinicComparison[] = []

  for (const clinic of typedClinics) {
    // Fetch revenue for this clinic
    const { data: revenueData } = await supabase
      .from('revenue')
      .select('total')
      .eq('clinic_id', clinic.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .throwOnError()

    // Fetch expenses for this clinic
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('clinic_id', clinic.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .throwOnError()

    // Cast to proper types
    const typedRevenue = revenueData as unknown as { total: number | null }[]
    const typedExpenses = expenseData as unknown as { amount: number | null }[]

    const revenue = typedRevenue?.reduce((sum, r) => sum + (r.total || 0), 0) || 0
    const costs = typedExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const profit = revenue - costs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    results.push({
      clinicId: clinic.id,
      clinicName: clinic.name,
      clinicSlug: clinic.slug,
      revenue,
      costs,
      profit,
      margin,
    })
  }

  // Sort by revenue descending
  return results.sort((a, b) => b.revenue - a.revenue)
}
