import { createClient } from '@/lib/supabase/server'

export interface Clinic {
  id: string
  name: string
  slug: string
}

export async function getClinics(): Promise<Clinic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, slug')
    .order('name')

  if (error) throw error
  return (data as unknown as Clinic[]) || []
}
