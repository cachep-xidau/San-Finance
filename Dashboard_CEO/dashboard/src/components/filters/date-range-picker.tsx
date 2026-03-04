'use client'

import { useState } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'

interface DateRangePickerProps {
  value: { start: Date; end: Date }
  onChange: (range: { start: Date; end: Date }) => void
}

const PRESETS = [
  {
    label: 'Tháng này', getValue: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
    }
  },
  {
    label: 'Tháng trước', getValue: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) }
    }
  },
  {
    label: 'Quý này', getValue: () => {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(now.getFullYear(), quarter * 3 + 3, 0) }
    }
  },
  {
    label: 'Năm nay', getValue: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) }
    }
  },
  {
    label: '12 tháng gần nhất', getValue: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
    }
  },
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDateRange = () => {
    const startStr = value.start.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
    const endStr = value.end.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
    if (startStr === endStr) return startStr
    return `${startStr} - ${endStr}`
  }

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue()
    onChange(range)
    setIsOpen(false)
  }

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
        <Calendar size={15} style={{ color: 'var(--accent)' }} />
        <span>{formatDateRange()}</span>
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
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
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
                {preset.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
