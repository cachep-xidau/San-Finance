'use client'

import { useState } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'

interface Clinic {
  id: string
  name: string
  slug: string
}

interface ClinicSelectProps {
  clinics: Clinic[]
  value: string | null // null = all clinics
  onChange: (clinicId: string | null) => void
}

export function ClinicSelect({ clinics, value, onChange }: ClinicSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedClinic = value ? clinics.find(c => c.id === value) : null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-main)',
        }}
      >
        <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm">{selectedClinic?.name || 'Tất cả chi nhánh'}</span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[180px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:opacity-80 transition-opacity"
              style={{
                color: 'var(--text-main)',
                fontWeight: value === null ? '600' : '400',
              }}
            >
              Tất cả chi nhánh
            </button>
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => {
                  onChange(clinic.id)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: 'var(--text-main)',
                  fontWeight: value === clinic.id ? '600' : '400',
                }}
              >
                {clinic.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
