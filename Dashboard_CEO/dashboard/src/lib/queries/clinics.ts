import { createClient } from '@/lib/supabase/server'

export interface Clinic {
  id: string
  name: string
  slug: string
}

// Clinics are derived from raw_revenue data, not a separate table
const KNOWN_CLINICS: Clinic[] = [
  { id: 'San', name: 'Nha khoa San', slug: 'san' },
  { id: 'Implant', name: 'Thế giới Implant', slug: 'implant' },
  { id: 'Teennie', name: 'Teennie', slug: 'teennie' },
]

export async function getClinics(): Promise<Clinic[]> {
  return KNOWN_CLINICS
}
