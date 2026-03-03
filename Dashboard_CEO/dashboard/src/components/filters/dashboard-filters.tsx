'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DateRangePicker } from '@/components/filters/date-range-picker'
import { ClinicSelect } from '@/components/filters/clinic-select'

interface Clinic {
  id: string
  name: string
  slug: string
}

interface DashboardFiltersProps {
  clinics: Clinic[]
  clinicId: string | null
  startDate: string
  endDate: string
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateParam(value: string): Date {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function DashboardFilters({
  clinics,
  clinicId,
  startDate,
  endDate,
}: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dateRange = useMemo(
    () => ({
      start: parseDateParam(startDate),
      end: parseDateParam(endDate),
    }),
    [startDate, endDate]
  )

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
        return
      }
      params.set(key, value)
    })

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        value={dateRange}
        onChange={(range) => {
          updateSearchParams({
            start: formatDateParam(range.start),
            end: formatDateParam(range.end),
          })
        }}
      />

      <ClinicSelect
        clinics={clinics}
        value={clinicId}
        onChange={(nextClinicId) => {
          updateSearchParams({ clinic: nextClinicId })
        }}
      />
    </div>
  )
}
