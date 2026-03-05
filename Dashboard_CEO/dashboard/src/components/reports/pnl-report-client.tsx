'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import type { PnLReportData, PnLSection } from '@/lib/queries/pnl-report'
import type { CostByClassify, CostGroup } from '@/lib/queries/cost-analysis-utils'

import React, { useState, useMemo } from 'react'

function fmtFull(amount: number): string {
    return amount.toLocaleString('vi-VN')
}

const CLINICS = [
    { id: null, label: 'Tất cả', color: '#6366F1', icon: '∑' },
    { id: 'San', label: 'Nha khoa San', color: '#3B82F6', icon: 'S' },
    { id: 'Teennie', label: 'Teennie', color: '#F59E0B', icon: 'T' },
    { id: 'Implant', label: 'Thế giới Implant', color: '#10B981', icon: 'I' },
]

type ViewMode = 'month' | 'quarter'

function monthsToQuarters(months: Record<string, number>): Record<string, number> {
    const q: Record<string, number> = {}
    for (const [m, v] of Object.entries(months)) {
        const qn = `Q${Math.ceil(parseInt(m) / 3)}`
        q[qn] = (q[qn] || 0) + v
    }
    return q
}

// P&L row styling
const COMPUTED_KEYS = new Set(['gross_profit', 'net_profit', 'op_profit', 'pre_tax', 'retained'])
const BOTTOM_LINE_KEY = 'retained'

function getRowStyle(section: PnLSection): React.CSSProperties {
    if (section.key === BOTTOM_LINE_KEY) {
        return { background: 'var(--cat-bg-total)', fontWeight: 'var(--weight-bold)' as any, color: '#34D399', fontSize: 'var(--text-sm)' }
    }
    if (section.type === 'computed') {
        return { background: 'var(--cat-bg-1)', fontWeight: 'var(--weight-bold)' as any, color: '#60A5FA' }
    }
    return {}
}

const CHART_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7',
    '#84CC16', '#E11D48', '#0EA5E9', '#D97706', '#7C3AED',
]

interface Props {
    report: PnLReportData
    prevYearReport: PnLReportData
    availableYears: number[]
    selectedYear: number
    selectedClinic: string | null
    clinicTotals: { all: number; San: number; Teennie: number; Implant: number }
    costsByClassify: CostByClassify[]
}

export function PnLReportClient({ report, prevYearReport, availableYears, selectedYear, selectedClinic, clinicTotals, costsByClassify }: Props) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())


    const periods = viewMode === 'month'
        ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        : ['Q1', 'Q2', 'Q3', 'Q4']

    const monthsWithData = report.monthsWithData.length
    const quartersWithData = report.quartersWithData.length

    function navigate(year: number, clinic: string | null) {
        const params = new URLSearchParams()
        params.set('year', year.toString())
        if (clinic) params.set('clinic', clinic)
        router.push(`/reports/pnl?${params.toString()}`)
    }

    function getValues(months: Record<string, number>): Record<string, number> {
        return viewMode === 'month' ? months : monthsToQuarters(months)
    }

    function avgMonth(total: number) { return monthsWithData > 0 ? total / monthsWithData : 0 }
    function avgQuarter(total: number) { return quartersWithData > 0 ? total / quartersWithData : 0 }

    function toggleExpand(key: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    // Find specific section by key
    const getSection = (key: string) => report.sections.find(s => s.key === key)
    const getPrevSection = (key: string) => prevYearReport.sections.find(s => s.key === key)
    const revenueTotal = getSection('revenue')?.total || 0
    const grossProfitTotal = getSection('gross_profit')?.total || 0
    const opProfitTotal = getSection('op_profit')?.total || 0
    const preTaxTotal = getSection('pre_tax')?.total || 0
    const retainedTotal = getSection('retained')?.total || 0
    const grossMargin = revenueTotal > 0 ? (grossProfitTotal / revenueTotal * 100) : 0
    const netMargin = revenueTotal > 0 ? (retainedTotal / revenueTotal * 100) : 0

    return (
        <div className="stack" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {/* Header */}
            <div className="san-page-header">
                <div>
                    <h1 className="san-page-title" style={{ fontFamily: 'var(--font-report)' }}>
                        Báo cáo Lãi Lỗ (P&L)
                    </h1>
                    <p className="san-page-subtitle">
                        Phân tích lợi nhuận — {report.sections.length} dòng · {selectedYear}
                    </p>
                </div>
            </div>

            {/* Clinic cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                {CLINICS.map(c => {
                    const isActive = selectedClinic === c.id
                    const clinicRevenue = c.id === null ? clinicTotals.all : clinicTotals[c.id as keyof typeof clinicTotals]
                    return (
                        <div key={c.id ?? 'all'} className="dashboard-section" onClick={() => navigate(selectedYear, c.id)}
                            style={{
                                cursor: 'pointer', padding: 'var(--space-4)', position: 'relative',
                                border: isActive ? `2px solid ${c.color}` : '2px solid transparent',
                                transition: 'border-color 0.2s',
                            }}>
                            {isActive && (
                                <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 'var(--text-xs)', background: c.color, color: '#fff', padding: '1px 8px', borderRadius: 6, fontWeight: 'var(--weight-medium)' as any }}>
                                    Đang chọn
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' as any }}>{c.icon}</div>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)' }}>{c.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DOANH THU</div>
                                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' as any, fontFamily: 'var(--font-report)', color: 'var(--text-primary)' }}>
                                        {formatCurrency(clinicRevenue)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Year selector + View mode */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {availableYears.map(y => (
                        <button key={y} onClick={() => navigate(y, selectedClinic)}
                            style={{
                                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                                background: y === selectedYear ? 'var(--accent)' : 'transparent',
                                color: y === selectedYear ? '#fff' : 'var(--text-secondary)',
                                fontSize: 'var(--text-xs)', cursor: 'pointer',
                            }}>
                            {y}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 6, padding: 2 }}>
                    {(['month', 'quarter'] as ViewMode[]).map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            style={{
                                padding: '4px 12px', borderRadius: 4, border: 'none',
                                background: viewMode === mode ? 'var(--surface-2)' : 'transparent',
                                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' as any, cursor: 'pointer',
                            }}>
                            {mode === 'month' ? 'Tháng' : 'Quý'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 5 Metric Cards ── */}
            {(() => {
                const prevRev = getPrevSection('revenue')?.total || 0
                const prevRetained = getPrevSection('retained')?.total || 0
                const cards = [
                    { label: 'Doanh thu', value: formatCurrency(revenueTotal), color: 'var(--accent)' },
                    { label: 'Lãi gộp', value: formatCurrency(grossProfitTotal), sub: `${grossMargin.toFixed(1)}%`, color: '#60A5FA' },
                    { label: 'LN kinh doanh', value: formatCurrency(opProfitTotal), color: '#C084FC' },
                    { label: 'LN trước thuế', value: formatCurrency(preTaxTotal), color: '#FBBF24' },
                    { label: 'LN chưa PP', value: formatCurrency(retainedTotal), sub: `biên ${netMargin.toFixed(1)}%`, color: retainedTotal >= 0 ? '#34D399' : '#F87171' },
                ]

                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)' }}>
                        {cards.map(c => (
                            <div key={c.label} className="dashboard-section" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' as any }}>{c.label}</div>
                                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' as any, color: c.color, marginTop: '4px', fontFamily: 'var(--font-report)' }}>
                                    {c.value}
                                </div>
                                {'sub' in c && c.sub && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{c.sub}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            })()}

            {/* ── Charts Row: Waterfall + Fixed/Variable + Donut ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: 'var(--space-4)' }}>
                {/* Waterfall chart */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Cấu trúc lãi lỗ (Waterfall)
                    </div>
                    {(() => {
                        const rev = getSection('revenue')?.total || 0
                        const cogs = getSection('cogs')?.total || 0
                        const gross = getSection('gross_profit')?.total || 0
                        const selling = getSection('selling')?.total || 0
                        const admin = getSection('admin')?.total || 0
                        const otherCost = getSection('other_costs')?.total || 0
                        const preTax = getSection('pre_tax')?.total || 0
                        const tax = getSection('tax')?.total || 0
                        const retained = getSection('retained')?.total || 0

                        // Waterfall steps: { label, value, type }
                        // type: 'start' = full bar from 0, 'decrease' = red bar going down, 'subtotal' = intermediate total, 'total' = final
                        const steps = [
                            { label: 'Doanh thu', value: rev, type: 'start' as const },
                            { label: 'Giá vốn', value: -cogs, type: 'decrease' as const },
                            { label: 'Lãi gộp', value: gross, type: 'subtotal' as const },
                            { label: 'CP bán hàng', value: -selling, type: 'decrease' as const },
                            { label: 'CP quản lý', value: -admin, type: 'decrease' as const },
                            { label: 'CP khác', value: -otherCost, type: 'decrease' as const },
                            { label: 'LN trước thuế', value: preTax, type: 'subtotal' as const },
                            { label: 'Thuế & lãi vay', value: -tax, type: 'decrease' as const },
                            { label: 'LN chưa PP', value: retained, type: 'total' as const },
                        ]

                        const chartH = 200
                        const barW = 44
                        const gap = 16
                        const svgW = steps.length * (barW + gap) + gap + 10
                        const maxVal = Math.max(...steps.map(s => Math.abs(s.value)), 1)
                        const scale = (v: number) => (Math.abs(v) / maxVal) * (chartH - 20)

                        // Calculate bar positions (waterfall logic)
                        let runningTop = 0
                        const bars = steps.map((step) => {
                            let top: number, h: number, color: string

                            if (step.type === 'start') {
                                // Full bar from bottom
                                h = scale(step.value)
                                top = chartH - h
                                runningTop = top
                                color = '#34D399' // green
                            } else if (step.type === 'decrease') {
                                // Red bar hanging from running top
                                h = scale(step.value)
                                top = runningTop
                                runningTop = top + h
                                color = '#F87171' // red
                            } else if (step.type === 'subtotal') {
                                // Blue bar showing subtotal level
                                h = scale(step.value)
                                top = chartH - h
                                runningTop = top
                                color = '#60A5FA' // blue
                            } else {
                                // Final total
                                h = scale(step.value)
                                if (step.value >= 0) {
                                    top = chartH - h
                                } else {
                                    top = chartH
                                    h = scale(step.value)
                                }
                                runningTop = top
                                color = step.value >= 0 ? '#34D399' : '#F87171'
                            }

                            return { ...step, top, h, color }
                        })

                        const fmtShort = (v: number) => {
                            const abs = Math.abs(v)
                            if (abs >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`
                            if (abs >= 1e6) return `${(v / 1e6).toFixed(0)} tr`
                            return `${(v / 1e3).toFixed(0)}K`
                        }

                        return (
                            <div style={{ overflowX: 'auto' }}>
                                <svg width={svgW} height={chartH + 50} style={{ display: 'block' }}>
                                    {/* Bars + labels */}
                                    {bars.map((bar, i) => {
                                        const x = i * (barW + gap) + gap
                                        return (
                                            <g key={bar.label}>
                                                {/* Bar */}
                                                <rect
                                                    x={x} y={bar.top} width={barW} height={Math.max(bar.h, 2)}
                                                    fill={bar.color} rx={4} opacity={0.85}
                                                />
                                                {/* Value on top */}
                                                <text
                                                    x={x + barW / 2} y={bar.top - 5}
                                                    textAnchor="middle" fontSize="10" fontWeight="600"
                                                    fill={bar.color}
                                                    style={{ fontFamily: 'var(--font-report)' }}
                                                >
                                                    {bar.type === 'decrease' ? `-${fmtShort(Math.abs(bar.value))}` : fmtShort(bar.value)}
                                                </text>
                                                {/* Label below */}
                                                <text
                                                    x={x + barW / 2} y={chartH + 14}
                                                    textAnchor="middle" fontSize="10" fill="var(--text-muted)"
                                                >
                                                    {bar.label}
                                                </text>
                                                {/* Connector line to next bar */}
                                                {i < bars.length - 1 && (
                                                    <line
                                                        x1={x + barW} y1={bar.type === 'decrease' ? bar.top + bar.h : bar.top}
                                                        x2={x + barW + gap} y2={bar.type === 'decrease' ? bar.top + bar.h : bar.top}
                                                        stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 2" opacity={0.4}
                                                    />
                                                )}
                                            </g>
                                        )
                                    })}
                                    {/* Baseline */}
                                    <line x1={gap - 4} y1={chartH} x2={svgW - 4} y2={chartH} stroke="var(--border)" strokeWidth={1} />
                                </svg>
                            </div>
                        )
                    })()}
                    <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#34D399' }} /> Doanh thu / Lợi nhuận
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F87171' }} /> Chi phí
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#60A5FA' }} /> Lãi gộp / Lãi thuần
                        </div>
                    </div>
                </div>

                {/* Fixed vs Variable Cost Chart */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Định phí vs Biến phí
                    </div>
                    {(() => {
                        // Classify each expense as fixed or variable
                        const FIXED_CLASSIFY = new Set([
                            'Lương cố định bộ phận văn phòng', 'Thuê mặt bằng', 'Bảo hiểm',
                            'Điện, nước, wifi', 'Chi phí phần mềm (CRM, kế toán, cloud)',
                            'Thuê bằng bác sĩ', 'Thuê xe, bãi xe', 'Đào tạo nhân sự',
                            'Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí..nộp NSNN', 'Phường, quận',
                        ])

                        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
                        const fixedByMonth: Record<string, number> = {}
                        const variableByMonth: Record<string, number> = {}

                        for (const c of costsByClassify) {
                            const isFixed = FIXED_CLASSIFY.has(c.classify)
                            for (const m of months) {
                                const v = c.months[m] || 0
                                if (isFixed) {
                                    fixedByMonth[m] = (fixedByMonth[m] || 0) + v
                                } else {
                                    variableByMonth[m] = (variableByMonth[m] || 0) + v
                                }
                            }
                        }

                        const totalFixed = Object.values(fixedByMonth).reduce((a, b) => a + b, 0)
                        const totalVariable = Object.values(variableByMonth).reduce((a, b) => a + b, 0)
                        const totalAll = totalFixed + totalVariable || 1

                        // Find max stacked value
                        let maxVal = 0
                        for (const m of months) {
                            maxVal = Math.max(maxVal, (fixedByMonth[m] || 0) + (variableByMonth[m] || 0))
                        }
                        maxVal = maxVal || 1

                        const chartH = 160
                        const barW = 18
                        const gap = 8
                        const leftPad = 45
                        const totalW = leftPad + months.length * (barW + gap) + 10

                        const formatAxis = (v: number) => {
                            if (v >= 1e9) return `${(v / 1e9).toFixed(1)}tỷ`
                            if (v >= 1e6) return `${(v / 1e6).toFixed(0)}tr`
                            return `${(v / 1e3).toFixed(0)}K`
                        }

                        return (
                            <div>
                                {/* Summary */}
                                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: '#3B82F610', border: '1px solid #3B82F630' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Định phí</div>
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' as any, color: '#3B82F6', fontFamily: 'var(--font-report)' }}>{formatCurrency(totalFixed)}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(totalFixed / totalAll * 100).toFixed(1)}%</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: '#F59E0B10', border: '1px solid #F59E0B30' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Biến phí</div>
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' as any, color: '#F59E0B', fontFamily: 'var(--font-report)' }}>{formatCurrency(totalVariable)}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(totalVariable / totalAll * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                {/* Stacked bar chart */}
                                <div style={{ overflowX: 'auto' }}>
                                    <svg width={totalW} height={chartH + 24} style={{ display: 'block' }}>
                                        {/* Y grid */}
                                        {[0, 0.5, 1].map(pct => (
                                            <g key={pct}>
                                                <line x1={leftPad} y1={chartH - pct * chartH} x2={totalW - 5} y2={chartH - pct * chartH} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                                                <text x={leftPad - 4} y={chartH - pct * chartH + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-report)' }}>{formatAxis(pct * maxVal)}</text>
                                            </g>
                                        ))}
                                        {/* Bars */}
                                        {months.map((m, mi) => {
                                            const fx = fixedByMonth[m] || 0
                                            const vx = variableByMonth[m] || 0
                                            const x = leftPad + mi * (barW + gap)
                                            const hFixed = (fx / maxVal) * chartH
                                            const hVar = (vx / maxVal) * chartH
                                            return (
                                                <g key={m}>
                                                    {/* Variable (bottom) */}
                                                    <rect x={x} y={chartH - hVar - hFixed} width={barW} height={hVar} rx={2} fill="#F59E0B" opacity={0.75} />
                                                    {/* Fixed (top of stack) */}
                                                    <rect x={x} y={chartH - hFixed} width={barW} height={hFixed} rx={2} fill="#3B82F6" opacity={0.75} />
                                                    {/* Month label */}
                                                    <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">T{parseInt(m)}</text>
                                                </g>
                                            )
                                        })}
                                    </svg>
                                </div>
                                {/* Legend */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3B82F6' }} /> Định phí
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} /> Biến phí
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>

                {/* Donut: Cost structure */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Cơ cấu chi phí
                    </div>
                    {(() => {
                        const costSections = report.sections.filter(s => s.type === 'data' && s.total > 0 && !['revenue', 'fin_income', 'other_income'].includes(s.key))
                        const totalCost = costSections.reduce((s, c) => s + c.total, 0) || 1
                        const colors = ['#60A5FA', '#C084FC', '#2DD4BF', '#FBBF24', '#F87171', '#9CA3AF', '#FB923C', '#A78BFA']
                        const r = 70, cx = 90, cy = 90, strokeW = 28
                        const circumference = 2 * Math.PI * r
                        let offset = 0

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <svg width={180} height={180} style={{ display: 'block' }}>
                                    {costSections.map((sec, i) => {
                                        const pct = sec.total / totalCost
                                        const dash = pct * circumference
                                        const currentOffset = offset
                                        offset += dash
                                        return (
                                            <circle key={sec.key} cx={cx} cy={cy} r={r} fill="none"
                                                stroke={colors[i % colors.length]} strokeWidth={strokeW}
                                                strokeDasharray={`${dash} ${circumference - dash}`}
                                                strokeDashoffset={-currentOffset}
                                                transform={`rotate(-90 ${cx} ${cy})`} opacity={0.85}
                                            />
                                        )
                                    })}
                                    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">Tổng CP</text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)" style={{ fontFamily: 'var(--font-report)' }}>
                                        {formatCurrency(totalCost)}
                                    </text>
                                </svg>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-2)', width: '100%' }}>
                                    {costSections.map((sec, i) => (
                                        <div key={sec.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length] }} />
                                                <span>{sec.label.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                            <span style={{ fontFamily: 'var(--font-report)', color: colors[i % colors.length] }}>{(sec.total / totalCost * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>




    <div className="dashboard-section" style={{ overflow: 'auto' }}>
        <div style={{ overflowX: 'auto' }}>
            <table className="san-table" style={{ minWidth: viewMode === 'month' ? '1200px' : '700px' }}>
                <thead>
                    <tr>
                        <th className="san-th" style={{ position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 2, minWidth: '260px' }}>
                            KHOẢN MỤC
                        </th>
                        {periods.map(p => (
                            <th key={p} className="san-th" style={{ textAlign: 'right', minWidth: '90px' }}>
                                {viewMode === 'month' ? `T${parseInt(p)}` : p}
                            </th>
                        ))}
                        <th className="san-th" style={{ textAlign: 'right', minWidth: '110px', borderLeft: '2px solid var(--border)' }}>NĂM</th>
                        <th className="san-th" style={{ textAlign: 'right', minWidth: '100px' }}>
                            TB/{viewMode === 'month' ? 'THÁNG' : 'QUÝ'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {report.sections.map(section => {
                        const isComputed = section.type === 'computed'
                        const hasItems = section.items && section.items.length > 0
                        const isExpanded = expanded.has(section.key)
                        const rowStyle = getRowStyle(section)
                        const vals = getValues(section.months)
                        const avg = viewMode === 'month' ? avgMonth(section.total) : avgQuarter(section.total)
                        const isNegativeRow = ['cogs', 'selling', 'admin', 'other_costs', 'other_exp', 'fin_expense', 'other_income_cost', 'tax'].includes(section.key)

                        return (
                            <React.Fragment key={section.key}>
                                {/* Section header row */}
                                <tr style={rowStyle}>
                                    <td className="san-td" style={{
                                        position: 'sticky', left: 0, zIndex: 1,
                                        background: isComputed ? rowStyle.background : 'var(--bg-surface)',
                                        fontWeight: isComputed ? 'var(--weight-bold)' as any : 'var(--weight-semibold)' as any,
                                        fontSize: 'var(--text-sm)',
                                        cursor: hasItems ? 'pointer' : 'default',
                                        fontFamily: 'var(--font-report)',
                                    }}
                                        onClick={() => hasItems && toggleExpand(section.key)}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {hasItems && <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>}
                                            {section.label}
                                        </span>
                                    </td>
                                    {periods.map(p => (
                                        <td key={p} className="san-td" style={{
                                            textAlign: 'right',
                                            fontFamily: 'var(--font-report)',
                                            color: isComputed ? rowStyle.color : (isNegativeRow ? '#F87171' : 'var(--text-primary)'),
                                            fontWeight: isComputed ? 'var(--weight-bold)' as any : undefined,
                                            ...rowStyle,
                                        }}>
                                            {(vals[p] || 0) !== 0 ? fmtFull(vals[p] || 0) : '—'}
                                        </td>
                                    ))}
                                    <td className="san-td" style={{
                                        textAlign: 'right', borderLeft: '2px solid var(--border)',
                                        fontFamily: 'var(--font-report)',
                                        color: isComputed ? rowStyle.color : (isNegativeRow ? '#F87171' : 'var(--text-primary)'),
                                        fontWeight: 'var(--weight-bold)' as any,
                                        ...rowStyle,
                                    }}>
                                        {section.total !== 0 ? fmtFull(section.total) : '—'}
                                    </td>
                                    <td className="san-td" style={{
                                        textAlign: 'right', fontFamily: 'var(--font-report)',
                                        color: isComputed ? rowStyle.color : 'var(--text-muted)',
                                        ...rowStyle,
                                    }}>
                                        {avg !== 0 ? fmtFull(Math.round(avg)) : '—'}
                                    </td>
                                </tr>
                                {/* Sub-items */}
                                {isExpanded && section.items?.map(item => {
                                    const itemVals = getValues(item.months)
                                    const itemAvg = viewMode === 'month' ? avgMonth(item.total) : avgQuarter(item.total)
                                    return (
                                        <tr key={item.classify}>
                                            <td className="san-td" style={{
                                                position: 'sticky', left: 0, zIndex: 1,
                                                background: 'var(--bg-surface)',
                                                paddingLeft: 'var(--space-6)',
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                {item.classify}
                                            </td>
                                            {periods.map(p => (
                                                <td key={p} className="san-td" style={{
                                                    textAlign: 'right', fontSize: 'var(--text-xs)',
                                                    fontFamily: 'var(--font-report)', color: 'var(--text-secondary)',
                                                }}>
                                                    {(itemVals[p] || 0) !== 0 ? fmtFull(itemVals[p] || 0) : '—'}
                                                </td>
                                            ))}
                                            <td className="san-td" style={{
                                                textAlign: 'right', borderLeft: '2px solid var(--border)',
                                                fontSize: 'var(--text-xs)', fontFamily: 'var(--font-report)',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                {item.total !== 0 ? fmtFull(item.total) : '—'}
                                            </td>
                                            <td className="san-td" style={{
                                                textAlign: 'right', fontSize: 'var(--text-xs)',
                                                fontFamily: 'var(--font-report)', color: 'var(--text-muted)',
                                            }}>
                                                {itemAvg !== 0 ? fmtFull(Math.round(itemAvg)) : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </React.Fragment>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
        </div >
    )
}
