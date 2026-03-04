'use client'

import { useState } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'

interface Clinic {
  id: string
  name: string
  slug: string
}

interface ClinicSelectProps {
  clinics: Clinic[]
  value: string | null
  onChange: (clinicId: string | null) => void
}

export function ClinicSelect({ clinics, value, onChange }: ClinicSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedClinic = value ? clinics.find(c => c.id === value) : null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-xs)',
          fontFamily: 'inherit',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        <Building2 size={15} style={{ color: 'var(--accent)' }} />
        <span>{selectedClinic?.name || 'Tất cả chi nhánh'}</span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 'var(--space-2)',
              padding: '0.35rem 0',
              borderRadius: 'var(--radius-lg)',
              zIndex: 20,
              minWidth: 200,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <button
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-4)',
                textAlign: 'left',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-bg)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
            >
              <span>Tất cả chi nhánh</span>
              {value === null && <Check size={14} style={{ color: 'var(--accent)' }} />}
            </button>
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 12px' }} />
            {clinics.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => {
                  onChange(clinic.id)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-bg)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
              >
                <span>{clinic.name}</span>
                {value === clinic.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
