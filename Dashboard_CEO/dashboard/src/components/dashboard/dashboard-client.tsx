'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { type ReactNode, useCallback } from 'react'

interface DashboardClientProps {
    selectedClinic: string | null
    clinicTotals: { all: number; San: number; Teennie: number; Implant: number }
    startDate: string
    endDate: string
    children: ReactNode
}

const CLINICS = [
    { id: null, label: 'Tất cả', color: '#6366F1' },
    { id: 'San', label: 'Nha khoa San', color: '#3B82F6' },
    { id: 'Teennie', label: 'Teennie', color: '#10B981' },
    { id: 'Implant', label: 'Thế giới Implant', color: '#F59E0B' },
]

function formatVND(value: number): string {
    if (value >= 1e9) return `₫${(value / 1e9).toFixed(2)} tỷ`
    if (value >= 1e6) return `₫${(value / 1e6).toFixed(1)} tr`
    if (value >= 1e3) return `₫${(value / 1e3).toFixed(0)}K`
    return `₫${value}`
}

function formatDateParam(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function DashboardClient({ selectedClinic, clinicTotals, startDate, endDate, children }: DashboardClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === '') params.delete(k)
            else params.set(k, v)
        })
        const q = params.toString()
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    }, [router, pathname, searchParams])

    const selectClinic = (id: string | null) => {
        updateParams({ clinic: id })
    }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const threeMonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const oneYearStart = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)

    const quickFilters = [
        { label: 'Tháng này', start: thisMonthStart, end: thisMonthEnd },
        { label: 'Tháng trước', start: lastMonthStart, end: lastMonthEnd },
        { label: '3 tháng', start: threeMonthsStart, end: thisMonthEnd },
        { label: '6 tháng', start: sixMonthsStart, end: thisMonthEnd },
        { label: '1 năm', start: oneYearStart, end: thisMonthEnd },
    ]

    // Determine active quick filter (compare by date string to avoid timezone mismatch)
    const currentStartStr = formatDateParam(new Date(startDate))
    const currentEndStr = formatDateParam(new Date(endDate))
    const activeQuickFilter = quickFilters.findIndex(f =>
        formatDateParam(f.start) === currentStartStr && formatDateParam(f.end) === currentEndStr
    )
    const isCustom = activeQuickFilter === -1

    return (
        <div className="stack">

            {/* Clinic cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                {CLINICS.map(c => {
                    const isActive = selectedClinic === c.id
                    const total = c.id === null ? clinicTotals.all : clinicTotals[c.id as keyof typeof clinicTotals]
                    return (
                        <button
                            key={c.id ?? 'all'}
                            onClick={() => selectClinic(c.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-1)',
                                padding: 'var(--space-3) var(--space-4)',
                                borderRadius: 'var(--radius-lg)',
                                border: `2px solid ${isActive ? c.color : 'var(--border)'}`,
                                background: isActive ? `${c.color}12` : 'var(--bg-card)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 0 0 1px ${c.color}40` : 'none',
                            }}
                        >
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: isActive ? c.color : 'var(--text-primary)' }}>
                                {c.label}
                            </span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {formatVND(total)}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Date filter buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {quickFilters.map((f, i) => {
                    const isActive = activeQuickFilter === i
                    return (
                        <button
                            key={f.label}
                            onClick={() => updateParams({ start: formatDateParam(f.start), end: formatDateParam(f.end) })}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-pill)',
                                border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-sm)',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                            }}
                        >
                            {f.label}
                        </button>
                    )
                })}

                {/* Custom date range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 'auto' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Từ</label>
                    <input
                        type="date"
                        value={currentStartStr}
                        onChange={e => {
                            if (e.target.value) updateParams({ start: e.target.value })
                        }}
                        style={{
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${isCustom ? 'var(--accent)' : 'var(--border)'}`,
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                        }}
                    />
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Đến</label>
                    <input
                        type="date"
                        value={currentEndStr}
                        onChange={e => {
                            if (e.target.value) updateParams({ end: e.target.value })
                        }}
                        style={{
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${isCustom ? 'var(--accent)' : 'var(--border)'}`,
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                        }}
                    />
                </div>
            </div>

            {/* Children: KPI cards, charts, table */}
            {children}
        </div>
    )
}
