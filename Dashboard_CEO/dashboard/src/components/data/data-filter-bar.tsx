'use client'

import { useMemo } from 'react'
import { Filter } from 'lucide-react'

interface DataFilterBarProps {
    // Time filter
    timePreset: string
    onTimePreset: (preset: string) => void
    dateFrom: string
    dateTo: string
    onDateFrom: (d: string) => void
    onDateTo: (d: string) => void
    // Category filters (expenses only)
    showCategoryFilters?: boolean
    financeOptions?: string[]
    classifyOptions?: string[]
    finance: string
    classify: string
    onFinance: (v: string) => void
    onClassify: (v: string) => void
    // Record count
    recordCount: number
}

const TIME_PRESETS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng này' },
    { key: '3months', label: '3 tháng' },
]

export function DataFilterBar(props: DataFilterBarProps) {
    const {
        timePreset, onTimePreset,
        dateFrom, dateTo, onDateFrom, onDateTo,
        showCategoryFilters, financeOptions, classifyOptions,
        finance, classify, onFinance, onClassify,
        recordCount,
    } = props

    const selectStyle = {
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        fontSize: 'var(--text-sm)',
        outline: 'none',
        cursor: 'pointer',
        minWidth: '140px',
    }

    const dateStyle = {
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        fontSize: 'var(--text-sm)',
        outline: 'none',
        width: '140px',
        colorScheme: 'dark',
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
        }}>
            {/* Time presets */}
            {TIME_PRESETS.map(p => (
                <button
                    key={p.key}
                    onClick={() => onTimePreset(p.key)}
                    style={{
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${timePreset === p.key ? 'var(--text-primary)' : 'var(--border)'}`,
                        background: timePreset === p.key ? 'var(--text-primary)' : 'transparent',
                        color: timePreset === p.key ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: timePreset === p.key ? 'var(--weight-medium)' : 'var(--weight-normal)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {p.label}
                </button>
            ))}

            {/* Date range */}
            <input
                type="date"
                value={dateFrom}
                onChange={e => { onDateFrom(e.target.value); onTimePreset('') }}
                style={dateStyle}
                placeholder="Từ ngày"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>—</span>
            <input
                type="date"
                value={dateTo}
                onChange={e => { onDateTo(e.target.value); onTimePreset('') }}
                style={dateStyle}
                placeholder="Đến ngày"
            />

            {/* Category filters (expenses only) */}
            {showCategoryFilters && (
                <>
                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
                    <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Lọc:</span>
                    <select
                        value={finance}
                        onChange={e => onFinance(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Tài chính</option>
                        {financeOptions?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select
                        value={classify}
                        onChange={e => onClassify(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Phân loại</option>
                        {classifyOptions?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </>
            )}

            {/* Spacer + record count */}
            <div style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {recordCount.toLocaleString('vi-VN')} dòng
            </div>
        </div>
    )
}
