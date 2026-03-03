'use client'

import { useState } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'

interface DateRange {
  start: Date
  end: Date
  label: string
}

interface DateRangePickerProps {
  value: { start: Date; end: Date }
  onChange: (range: { start: Date; end: Date }) => void
}

const PRESETS = [
  { label: 'Tháng này', getValue: () => {
    const now = new Date()
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
  }},
  { label: 'Tháng trước', getValue: () => {
    const now = new Date()
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) }
  }},
  { label: 'Quý này', getValue: () => {
    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3)
    return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(now.getFullYear(), quarter * 3 + 3, 0) }
  }},
  { label: 'Năm nay', getValue: () => {
    const now = new Date()
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) }
  }},
  { label: '12 tháng gần nhất', getValue: () => {
    const now = new Date()
    return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
  }},
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
        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm">{formatDateRange()}</span>
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
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className="w-full px-3 py-2 text-left text-sm hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-main)' }}
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
