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

function dateToMonth(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CLINICS = [
  { id: 'San', name: 'Nha khoa San', slug: 'san' },
  { id: 'Implant', name: 'Thế giới Implant', slug: 'implant' },
  { id: 'Teennie', name: 'Teennie', slug: 'teennie' },
]

export async function getClinicComparison(
  startDate?: Date,
  endDate?: Date
): Promise<ClinicComparison[]> {
  const supabase = await createClient()

  const now = new Date()
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startMonth = dateToMonth(start)
  const endMonth = dateToMonth(end)

  // Fetch all revenue and expenses in range at once
  const { data: revData } = await supabase
    .from('raw_revenue').select('clinic, total')
    .gte('month', startMonth).lte('month', endMonth).gt('total', 0)

  const { data: expData } = await supabase
    .from('raw_expenses').select('clinic, amount')
    .gte('month', startMonth).lte('month', endMonth).gt('amount', 0)

  // Aggregate by clinic
  const revByClinic: Record<string, number> = {}
  for (const r of (revData as any[]) || []) {
    revByClinic[r.clinic] = (revByClinic[r.clinic] || 0) + (r.total || 0)
  }

  const expByClinic: Record<string, number> = {}
  for (const r of (expData as any[]) || []) {
    expByClinic[r.clinic] = (expByClinic[r.clinic] || 0) + (r.amount || 0)
  }

  return CLINICS.map(c => {
    const revenue = revByClinic[c.id] || 0
    const costs = expByClinic[c.id] || 0
    const profit = revenue - costs
    return {
      clinicId: c.id,
      clinicName: c.name,
      clinicSlug: c.slug,
      revenue,
      costs,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    }
  }).sort((a, b) => b.revenue - a.revenue)
}
