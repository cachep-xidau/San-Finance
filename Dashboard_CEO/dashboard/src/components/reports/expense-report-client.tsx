'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import type { ExpenseReportData } from '@/lib/queries/expense-report'
import type { CostByClassify } from '@/lib/queries/cost-analysis-types'
import { groupByFinance } from '@/lib/queries/cost-analysis-utils'
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
    costsByClassify: CostByClassify[]
}

const CHART_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7',
    '#84CC16', '#E11D48', '#0EA5E9', '#D97706', '#7C3AED',
]

export function ExpenseReportClient({ report, prevYearReport, availableYears, selectedYear, selectedClinic, clinicTotals, costsByClassify }: Props) {
    const router = useRouter()
    const [selectedCosts, setSelectedCosts] = useState<Set<string>>(new Set())
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

            {/* ── Interactive Cost Comparison Chart ── */}
            <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                    <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)' }}>
                            So sánh chi phí theo danh mục
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Chọn các khoản chi phí để so sánh trực quan qua {viewMode === 'month' ? 'tháng' : 'quý'}
                        </div>
                    </div>
                    {selectedCosts.size > 0 && (
                        <button onClick={() => setSelectedCosts(new Set())} style={{
                            padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
                            background: 'transparent', color: 'var(--text-muted)', fontSize: 'var(--text-xs)',
                            cursor: 'pointer'
                        }}>Bỏ chọn tất cả</button>
                    )}
                </div>

                {/* Category selector chips — grouped by finance */}
                {(() => {
                    const groups = groupByFinance(costsByClassify)
                    const GROUP_COLORS: Record<string, string> = {
                        '1': '#10B981', '2': '#3B82F6', '3': '#8B5CF6',
                        '4': '#F59E0B', '5': '#EF4444', '6': '#6B7280',
                    }
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                            {groups.map(group => {
                                const gKey = group.finance.charAt(0)
                                const gColor = GROUP_COLORS[gKey] || '#6B7280'
                                const groupSelected = group.items.filter(i => selectedCosts.has(i.classify)).length
                                return (
                                    <div key={group.finance} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '8px 12px', background: `${gColor}08`,
                                                borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                const allSelected = group.items.every(i => selectedCosts.has(i.classify))
                                                setSelectedCosts(prev => {
                                                    const next = new Set(prev)
                                                    if (allSelected) { group.items.forEach(i => next.delete(i.classify)) }
                                                    else { group.items.forEach(i => next.add(i.classify)) }
                                                    return next
                                                })
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 6, height: 20, borderRadius: 3, background: gColor }} />
                                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)' }}>{group.finance}</span>
                                                {groupSelected > 0 && (
                                                    <span style={{ fontSize: '10px', background: gColor, color: '#fff', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{groupSelected}/{group.items.length}</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-report)' }}>{formatCurrency(group.total)}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px 12px' }}>
                                            {group.items.map(c => {
                                                const globalIdx = costsByClassify.findIndex(x => x.classify === c.classify)
                                                const isActive = selectedCosts.has(c.classify)
                                                const color = CHART_COLORS[globalIdx % CHART_COLORS.length]
                                                return (
                                                    <button key={c.classify} onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedCosts(prev => {
                                                            const next = new Set(prev)
                                                            next.has(c.classify) ? next.delete(c.classify) : next.add(c.classify)
                                                            return next
                                                        })
                                                    }} style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                                                        border: `1.5px solid ${isActive ? color : 'var(--border)'}`,
                                                        background: isActive ? `${color}15` : 'transparent',
                                                        color: isActive ? color : 'var(--text-secondary)',
                                                        fontSize: '10px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                                                    }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? color : 'var(--border)' }} />
                                                        {c.classify}
                                                        <span style={{ opacity: 0.6 }}>{formatCurrency(c.total)}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })()}

                {/* Chart */}
                {selectedCosts.size === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Chọn các mục chi phí ở trên để hiển thị biểu đồ so sánh</span>
                    </div>
                ) : (
                    (() => {
                        const selected = costsByClassify.filter(c => selectedCosts.has(c.classify))
                        const isMonth = viewMode === 'month'
                        const pds = isMonth
                            ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
                            : ['Q1', 'Q2', 'Q3', 'Q4']

                        const series = selected.map(c => {
                            const vals = isMonth ? c.months : monthsToQuarters(c.months)
                            const color = CHART_COLORS[costsByClassify.findIndex(x => x.classify === c.classify) % CHART_COLORS.length]
                            return { classify: c.classify, vals, color }
                        })

                        let maxVal = 0
                        for (const s of series) { for (const p of pds) { maxVal = Math.max(maxVal, s.vals[p] || 0) } }
                        maxVal = maxVal || 1

                        const chartH = 200, leftPad = 60, rightPad = 20
                        const chartW = pds.length * (isMonth ? 58 : 120)
                        const svgW = chartW + leftPad + rightPad
                        const stepX = chartW / (pds.length - 1 || 1)

                        const formatAxis = (v: number) => {
                            if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`
                            if (v >= 1e6) return `${(v / 1e6).toFixed(0)} tr`
                            return `${(v / 1e3).toFixed(0)}K`
                        }

                        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({ y: chartH - pct * chartH, label: formatAxis(pct * maxVal) }))

                        return (
                            <div style={{ overflowX: 'auto' }}>
                                <svg width={svgW} height={chartH + 40} style={{ display: 'block' }}>
                                    {yTicks.map(t => (
                                        <g key={t.y}>
                                            <line x1={leftPad} y1={t.y} x2={svgW - rightPad} y2={t.y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                                            <text x={leftPad - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-report)' }}>{t.label}</text>
                                        </g>
                                    ))}
                                    {pds.map((p, pi) => (
                                        <text key={p} x={leftPad + pi * stepX} y={chartH + 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{isMonth ? `T${parseInt(p)}` : p}</text>
                                    ))}
                                    {series.map(s => {
                                        const pts = pds.map((p, pi) => ({ x: leftPad + pi * stepX, y: chartH - ((s.vals[p] || 0) / maxVal) * chartH }))
                                        let d = `M${pts[0].x},${pts[0].y}`
                                        const tension = 0.3
                                        for (let i = 0; i < pts.length - 1; i++) {
                                            const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
                                            d += ` C${p1.x + (p2.x - p0.x) * tension},${p1.y + (p2.y - p0.y) * tension} ${p2.x - (p3.x - p1.x) * tension},${p2.y - (p3.y - p1.y) * tension} ${p2.x},${p2.y}`
                                        }
                                        return (
                                            <g key={s.classify}>
                                                <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
                                                {pds.map((p, pi) => {
                                                    const x = leftPad + pi * stepX, y = chartH - ((s.vals[p] || 0) / maxVal) * chartH
                                                    return (s.vals[p] || 0) > 0 ? <circle key={pi} cx={x} cy={y} r={4} fill="var(--bg-card)" stroke={s.color} strokeWidth={2} /> : null
                                                })}
                                            </g>
                                        )
                                    })}
                                </svg>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'var(--space-2)', paddingLeft: leftPad }}>
                                    {series.map(s => (
                                        <div key={s.classify} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                            <div style={{ width: 12, height: 3, borderRadius: 2, background: s.color }} />
                                            {s.classify}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()
                )}
            </div>
        </div>
    )
}
