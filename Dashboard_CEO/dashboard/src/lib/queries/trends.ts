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
  const now = new Date()
  const data: TrendDataPoint[] = []

  // Build month keys for the last N months
  const monthKeys: { key: string; label: string }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
    monthKeys.push({ key, label })
  }

  const startMonth = monthKeys[0].key
  const endMonth = monthKeys[monthKeys.length - 1].key

  // Fetch all revenue in range
  let revQ = supabase.from('raw_revenue').select('month, total').gte('month', startMonth).lte('month', endMonth).gt('total', 0)
  if (clinicId) revQ = revQ.eq('clinic', clinicId)
  const { data: revRows } = await revQ

  // Fetch all expenses in range
  let expQ = supabase.from('raw_expenses').select('month, amount').gte('month', startMonth).lte('month', endMonth).gt('amount', 0)
  if (clinicId) expQ = expQ.eq('clinic', clinicId)
  const { data: expRows } = await expQ

  // Aggregate by month
  const revByMonth: Record<string, number> = {}
  for (const r of (revRows as any[]) || []) {
    revByMonth[r.month] = (revByMonth[r.month] || 0) + (r.total || 0)
  }

  const expByMonth: Record<string, number> = {}
  for (const r of (expRows as any[]) || []) {
    expByMonth[r.month] = (expByMonth[r.month] || 0) + (r.amount || 0)
  }

  for (const mk of monthKeys) {
    const revenue = revByMonth[mk.key] || 0
    const costs = expByMonth[mk.key] || 0
    data.push({
      month: mk.key,
      monthLabel: mk.label,
      revenue,
      costs,
      profit: revenue - costs,
    })
  }

  return data
}
