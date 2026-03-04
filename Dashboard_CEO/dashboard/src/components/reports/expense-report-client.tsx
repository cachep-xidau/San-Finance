'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import type { ExpenseReportData } from '@/lib/queries/expense-report'
import React, { useState } from 'react'

/** Full number format for table cells — no abbreviation */
function fmtFull(amount: number): string {
    return amount.toLocaleString('vi-VN')
}

const CLINICS = [
    { id: null, label: 'Tất cả', color: '#6366F1', icon: '∑' },
    { id: 'San', label: 'Nha khoa San', color: '#3B82F6', icon: 'S' },
    { id: 'Teennie', label: 'Teennie', color: '#F59E0B', icon: 'T' },
    { id: 'Implant', label: 'Thế giới Implant', color: '#10B981', icon: 'I' },
]

const CAT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
    '1': { bg: 'var(--cat-bg-1)', text: '#60A5FA' },
    '2': { bg: 'var(--cat-bg-2)', text: '#C084FC' },
    '3': { bg: 'var(--cat-bg-3)', text: '#2DD4BF' },
    '4': { bg: 'var(--cat-bg-4)', text: '#FBBF24' },
    '5': { bg: 'var(--cat-bg-5)', text: '#F87171' },
    '6': { bg: 'var(--cat-bg-6)', text: '#9CA3AF' },
}

function getCatColor(name: string) {
    return CAT_BADGE_COLORS[name.charAt(0)] || { bg: 'var(--bg-surface)', text: 'var(--text-secondary)' }
}

function formatTotal(amount: number): string {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)} tỷ`
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)} tr`
    return amount.toLocaleString('vi-VN')
}

type ViewMode = 'month' | 'quarter'

function monthsToQuarters(months: Record<string, number>): Record<string, number> {
    const q: Record<string, number> = {}
    for (const [m, v] of Object.entries(months)) {
        const qn = `Q${Math.ceil(parseInt(m) / 3)}`
        q[qn] = (q[qn] || 0) + v
    }
    return q
}

interface Props {
    report: ExpenseReportData
    prevYearReport: ExpenseReportData
    availableYears: number[]
    selectedYear: number
    selectedClinic: string | null
    clinicTotals: { all: number; San: number; Teennie: number; Implant: number }
}

export function ExpenseReportClient({ report, prevYearReport, availableYears, selectedYear, selectedClinic, clinicTotals }: Props) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>('month')

    const allMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const periods = viewMode === 'month' ? allMonths : allQuarters
    const monthsWithData = report.monthsWithData.length
    const quartersWithData = report.quartersWithData.length

    function navigate(year: number, clinic: string | null) {
        const params = new URLSearchParams()
        params.set('year', year.toString())
        if (clinic) params.set('clinic', clinic)
        router.push(`/reports/expenses?${params.toString()}`)
    }

    function getValues(months: Record<string, number>): Record<string, number> {
        return viewMode === 'month' ? months : monthsToQuarters(months)
    }

    function avgMonth(total: number) {
        return monthsWithData > 0 ? total / monthsWithData : 0
    }

    function avgQuarter(total: number) {
        return quartersWithData > 0 ? total / quartersWithData : 0
    }

    return (
        <div className="stack" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {/* Header */}
            <div className="san-page-header">
                <div>
                    <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        Báo cáo chi phí
                    </h1>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Phân tích chi phí theo danh mục — {report.categories.length} nhóm · {selectedYear}
                    </p>
                </div>
            </div>

            {/* Clinic Cards — matching /data/expenses style */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                {CLINICS.map(c => {
                    const isSelected = selectedClinic === c.id
                    const total = c.id === null
                        ? clinicTotals.all
                        : clinicTotals[c.id as keyof typeof clinicTotals] || 0
                    const catCount = c.id === null
                        ? report.categories.length
                        : report.categories.filter(cat => cat.subtotalYear > 0).length

                    return (
                        <button
                            key={c.id ?? 'all'}
                            onClick={() => navigate(selectedYear, isSelected && c.id !== null ? null : c.id)}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-3)',
                                padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-lg)',
                                border: `2px solid ${isSelected ? c.color : 'var(--border)'}`,
                                background: 'var(--bg-card)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? `0 0 0 1px ${c.color}20` : 'none',
                            }}
                        >
                            {/* Badge "Đang chọn" */}
                            {isSelected && (
                                <span style={{
                                    position: 'absolute',
                                    top: 'var(--space-3)',
                                    right: 'var(--space-3)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: c.color,
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'var(--weight-semibold)',
                                }}>
                                    Đang chọn
                                </span>
                            )}

                            {/* Icon + Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${c.color}20`,
                                    color: c.color,
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 'var(--weight-bold)',
                                }}>
                                    {c.icon}
                                </span>
                                <span style={{
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 'var(--weight-semibold)',
                                    color: 'var(--text-primary)',
                                }}>
                                    {c.label}
                                </span>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                                <div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Danh mục
                                    </div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                                        {catCount}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Chi phí
                                    </div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                                        {formatTotal(total)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Year Selector + View Mode */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {availableYears.map(y => (
                        <button
                            key={y}
                            onClick={() => navigate(y, selectedClinic)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-md)',
                                border: y === selectedYear ? '1px solid var(--accent)' : '1px solid var(--border)',
                                background: y === selectedYear ? 'var(--primary-bg)' : 'transparent',
                                color: y === selectedYear ? 'var(--accent)' : 'var(--text-muted)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--weight-medium)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {y}
                        </button>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                    {(['month', 'quarter'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: viewMode === mode ? 'var(--surface-2)' : 'transparent',
                                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 'var(--weight-medium)',
                                cursor: 'pointer',
                            }}
                        >
                            {mode === 'month' ? 'Tháng' : 'Quý'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 5 Metric Cards ── */}
            {(() => {
                // YoY comparison: compare same months that current year has data
                const currentMonths = report.monthsWithData
                let prevYTD = 0
                for (const m of currentMonths) {
                    prevYTD += prevYearReport.grandTotal[m] || 0
                }
                const currentYTD = report.grandTotalYear
                const yoyChange = prevYTD > 0 ? ((currentYTD - prevYTD) / prevYTD) * 100 : 0

                // Biến phí / Định phí
                let bienPhi = 0, dinhPhi = 0
                for (const cat of report.categories) {
                    for (const item of cat.items) {
                        if (item.expense_type === 'Biến phí') bienPhi += item.total
                        else dinhPhi += item.total
                    }
                }
                const totalExpType = bienPhi + dinhPhi
                const bienPhiPct = totalExpType > 0 ? (bienPhi / totalExpType * 100) : 0

                const cards = [
                    { label: 'Tổng chi phí năm', value: formatCurrency(currentYTD), color: 'var(--accent)' },
                    { label: 'TB / Tháng', value: formatCurrency(avgMonth(currentYTD)), color: '#60A5FA' },
                    { label: 'TB / Quý', value: formatCurrency(avgQuarter(currentYTD)), color: '#C084FC' },
                    { label: 'Biến phí / Định phí', value: `${bienPhiPct.toFixed(0)}% / ${(100 - bienPhiPct).toFixed(0)}%`, color: '#2DD4BF' },
                    { label: `So cùng kỳ ${selectedYear - 1}`, value: `${yoyChange >= 0 ? '+' : ''}${yoyChange.toFixed(1)}%`, color: yoyChange > 0 ? '#F87171' : '#34D399' },
                ]

                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)' }}>
                        {cards.map(c => (
                            <div key={c.label} className="dashboard-section" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>{c.label}</div>
                                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: c.color, marginTop: '4px', fontFamily: 'var(--font-report)' }}>
                                    {c.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            })()}

            {/* ── Charts Row: Stacked Bar (2/3) + Donut (1/3) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                {/* Chart A: Stacked Bar — by Period */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Chi phí theo {viewMode === 'month' ? 'tháng' : 'quý'}
                    </div>
                    {(() => {
                        const isMonth = viewMode === 'month'
                        const chartPeriods = isMonth
                            ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
                            : ['Q1', 'Q2', 'Q3', 'Q4']
                        const catColors = ['#60A5FA', '#C084FC', '#2DD4BF', '#FBBF24', '#F87171', '#9CA3AF']

                        // Get per-period values for each category
                        const getCatPeriodVal = (cat: typeof report.categories[0], p: string) => {
                            if (isMonth) return cat.subtotal[p] || 0
                            return monthsToQuarters(cat.subtotal)[p] || 0
                        }

                        const periodTotals = chartPeriods.map(p => {
                            let total = 0
                            for (const cat of report.categories) total += getCatPeriodVal(cat, p)
                            return total
                        })
                        const maxPeriod = Math.max(...periodTotals, 1)

                        const barW = isMonth ? 40 : 80
                        const gap = isMonth ? 12 : 24
                        const chartH = 180
                        const svgW = chartPeriods.length * (barW + gap) + gap

                        return (
                            <div style={{ overflowX: 'auto' }}>
                                <svg width={svgW} height={chartH + 30} style={{ display: 'block' }}>
                                    {chartPeriods.map((p, pi) => {
                                        const x = pi * (barW + gap) + gap
                                        let yOffset = chartH

                                        return (
                                            <g key={p}>
                                                {report.categories.map((cat, ci) => {
                                                    const val = getCatPeriodVal(cat, p)
                                                    const h = maxPeriod > 0 ? (val / maxPeriod) * chartH : 0
                                                    yOffset -= h
                                                    return (
                                                        <rect
                                                            key={cat.name}
                                                            x={x} y={yOffset} width={barW} height={h}
                                                            fill={catColors[ci % catColors.length]}
                                                            rx={ci === report.categories.length - 1 ? 3 : 0}
                                                            opacity={0.85}
                                                        />
                                                    )
                                                })}
                                                <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                                                    {isMonth ? `T${parseInt(p)}` : p}
                                                </text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            </div>
                        )
                    })()}
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 'var(--space-2)' }}>
                        {report.categories.map((cat, i) => (
                            <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: ['#60A5FA', '#C084FC', '#2DD4BF', '#FBBF24', '#F87171', '#9CA3AF'][i % 6] }} />
                                {cat.name.replace(/^\d+\.\s*/, '')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart C: Donut — Category Proportion */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Tỷ trọng danh mục
                    </div>
                    {(() => {
                        const catColors = ['#60A5FA', '#C084FC', '#2DD4BF', '#FBBF24', '#F87171', '#9CA3AF']
                        const total = report.grandTotalYear || 1
                        const r = 70, cx = 90, cy = 90, strokeW = 28
                        const circumference = 2 * Math.PI * r
                        let offset = 0

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <svg width={180} height={180} style={{ display: 'block' }}>
                                    {report.categories.map((cat, i) => {
                                        const pct = cat.subtotalYear / total
                                        const dash = pct * circumference
                                        const currentOffset = offset
                                        offset += dash
                                        return (
                                            <circle
                                                key={cat.name}
                                                cx={cx} cy={cy} r={r}
                                                fill="none"
                                                stroke={catColors[i % 6]}
                                                strokeWidth={strokeW}
                                                strokeDasharray={`${dash} ${circumference - dash}`}
                                                strokeDashoffset={-currentOffset}
                                                transform={`rotate(-90 ${cx} ${cy})`}
                                                opacity={0.85}
                                            />
                                        )
                                    })}
                                    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">Tổng</text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)" style={{ fontFamily: 'var(--font-report)' }}>
                                        {formatCurrency(total)}
                                    </text>
                                </svg>
                                {/* Donut legend */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-2)', width: '100%' }}>
                                    {report.categories.map((cat, i) => {
                                        const pct = (cat.subtotalYear / total * 100).toFixed(1)
                                        return (
                                            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[i % 6] }} />
                                                    <span>{cat.name.replace(/^\d+\.\s*/, '')}</span>
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-report)', color: catColors[i % 6] }}>{pct}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
            {/* Single Unified Table */}
            <div className="dashboard-section" style={{ overflow: 'auto' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="san-table" style={{ minWidth: viewMode === 'month' ? '1200px' : '700px' }}>
                        <thead>
                            <tr>
                                <th className="san-th" style={{ position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 2, minWidth: '220px' }}>
                                    Phân loại
                                </th>
                                {periods.map(p => (
                                    <th key={p} className="san-th" style={{ textAlign: 'right', minWidth: '90px' }}>
                                        {viewMode === 'month' ? `T${parseInt(p)}` : p}
                                    </th>
                                ))}
                                <th className="san-th" style={{ textAlign: 'right', minWidth: '100px', borderLeft: '2px solid var(--border)' }}>TB/Tháng</th>
                                <th className="san-th" style={{ textAlign: 'right', minWidth: '100px' }}>TB/Quý</th>
                                <th className="san-th" style={{ textAlign: 'right', minWidth: '110px', fontWeight: 'var(--weight-bold)' }}>Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.categories.map(cat => {
                                const color = getCatColor(cat.name)
                                const catValues = getValues(cat.subtotal)

                                return (
                                    <React.Fragment key={cat.name}>{/* Category header row with subtotals */}
                                        <tr key={`cat-${cat.name}`} style={{ background: color.bg }}>
                                            <td className="san-td" style={{
                                                position: 'sticky', left: 0, zIndex: 1,
                                                fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)', color: color.text,
                                                background: color.bg,
                                            }}>
                                                {cat.name}
                                            </td>
                                            {periods.map(p => (
                                                <td key={p} className="san-td" style={{
                                                    textAlign: 'right',
                                                    fontFamily: 'var(--font-report)',
                                                    fontSize: 'var(--text-xs)',
                                                    fontWeight: 'var(--weight-bold)',
                                                    color: catValues[p] ? color.text : 'var(--text-muted)',
                                                    opacity: catValues[p] ? 1 : 0.3,
                                                    background: color.bg,
                                                }}>
                                                    {catValues[p] ? fmtFull(catValues[p]) : '—'}
                                                </td>
                                            ))}
                                            <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', borderLeft: '2px solid var(--border)', color: '#60A5FA', background: color.bg }}>
                                                {fmtFull(avgMonth(cat.subtotalYear))}
                                            </td>
                                            <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#C084FC', background: color.bg }}>
                                                {fmtFull(avgQuarter(cat.subtotalYear))}
                                            </td>
                                            <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: color.text, background: color.bg }}>
                                                {fmtFull(cat.subtotalYear)}
                                            </td>
                                        </tr>

                                        {/* Item rows */}
                                        {cat.items.map(item => {
                                            const vals = getValues(item.months)
                                            return (
                                                <tr key={item.classify}>
                                                    <td className="san-td" style={{ position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 1, fontSize: 'var(--text-xs)', paddingLeft: 'var(--space-6)' }}>
                                                        {item.classify}
                                                    </td>
                                                    {periods.map(p => (
                                                        <td key={p} className="san-td" style={{
                                                            textAlign: 'right',
                                                            fontFamily: 'var(--font-report)',
                                                            fontSize: 'var(--text-xs)',
                                                            color: vals[p] ? 'var(--text-primary)' : 'var(--text-muted)',
                                                            opacity: vals[p] ? 1 : 0.3,
                                                        }}>
                                                            {vals[p] ? fmtFull(vals[p]) : '—'}
                                                        </td>
                                                    ))}
                                                    <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', borderLeft: '2px solid var(--border)', color: '#60A5FA' }}>
                                                        {fmtFull(avgMonth(item.total))}
                                                    </td>
                                                    <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', color: '#C084FC' }}>
                                                        {fmtFull(avgQuarter(item.total))}
                                                    </td>
                                                    <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                                                        {fmtFull(item.total)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </React.Fragment>
                                )
                            })}

                            {/* Grand Total Row */}
                            <tr style={{ background: 'var(--cat-bg-total)', borderTop: '3px solid var(--accent)' }}>
                                <td className="san-td" style={{
                                    position: 'sticky', left: 0, zIndex: 1,
                                    fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)',
                                    color: 'var(--accent)',
                                    background: 'var(--cat-bg-total)',
                                    minWidth: '220px',
                                }}>
                                    TỔNG CHI PHÍ
                                </td>
                                {periods.map(p => {
                                    const vals = getValues(report.grandTotal)
                                    return (
                                        <td key={p} className="san-td" style={{
                                            textAlign: 'right',
                                            fontFamily: 'var(--font-report)',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 'var(--weight-bold)',
                                            color: 'var(--accent)',
                                            background: 'var(--cat-bg-total)',
                                        }}>
                                            {vals[p] ? fmtFull(vals[p]) : '—'}
                                        </td>
                                    )
                                })}
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', borderLeft: '2px solid var(--border)', color: '#60A5FA', background: 'var(--cat-bg-total)' }}>
                                    {fmtFull(avgMonth(report.grandTotalYear))}
                                </td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#C084FC', background: 'var(--cat-bg-total)' }}>
                                    {fmtFull(avgQuarter(report.grandTotalYear))}
                                </td>
                                <td className="san-td" style={{
                                    textAlign: 'right', fontFamily: 'var(--font-report)', fontSize: 'var(--text-sm)',
                                    fontWeight: 'var(--weight-bold)', color: 'var(--accent)', background: 'var(--cat-bg-total)',
                                }}>
                                    {fmtFull(report.grandTotalYear)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
