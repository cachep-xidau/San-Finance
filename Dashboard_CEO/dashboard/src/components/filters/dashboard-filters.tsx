'use client'

import { useEffect, useMemo, useRef } from 'react'
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
  const pendingParamsRef = useRef<URLSearchParams | null>(null)

  useEffect(() => {
    pendingParamsRef.current = new URLSearchParams(searchParams.toString())
  }, [searchParams])

  const dateRange = useMemo(
    () => ({
      start: parseDateParam(startDate),
      end: parseDateParam(endDate),
    }),
    [startDate, endDate]
  )

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const baseParams = pendingParamsRef.current
      ? new URLSearchParams(pendingParamsRef.current)
      : new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        baseParams.delete(key)
        return
      }
      baseParams.set(key, value)
    })

    pendingParamsRef.current = new URLSearchParams(baseParams)
    const query = baseParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="filter-row">
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
