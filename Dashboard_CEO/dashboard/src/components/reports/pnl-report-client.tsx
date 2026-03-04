'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import type { PnLReportData, PnLSection } from '@/lib/queries/pnl-report'
import React, { useState } from 'react'

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

interface Props {
    report: PnLReportData
    prevYearReport: PnLReportData
    availableYears: number[]
    selectedYear: number
    selectedClinic: string | null
    clinicTotals: { all: number; San: number; Teennie: number; Implant: number }
}

export function PnLReportClient({ report, prevYearReport, availableYears, selectedYear, selectedClinic, clinicTotals }: Props) {
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

            {/* ── Charts Row: Revenue vs Expenses Bar (2/3) + Donut (1/3) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
                {/* Stacked Bar: Revenue vs Total Expenses by period */}
                <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as any, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                        Doanh thu vs Chi phí theo {viewMode === 'month' ? 'tháng' : 'quý'}
                    </div>
                    {(() => {
                        const revMonths = getValues(getSection('revenue')?.months || {})
                        const cogsMonths = getValues(getSection('cogs')?.months || {})
                        const sellingMonths = getValues(getSection('selling')?.months || {})
                        const adminMonths = getValues(getSection('admin')?.months || {})
                        const otherMonths = getValues(getSection('other_costs')?.months || {})
                        const taxMonths = getValues(getSection('tax')?.months || {})

                        const isMonth = viewMode === 'month'
                        const barW = isMonth ? 20 : 40
                        const gap = isMonth ? 24 : 40
                        const chartH = 180
                        const svgW = periods.length * (barW * 2 + gap) + gap

                        const allVals: number[] = []
                        for (const p of periods) {
                            allVals.push(revMonths[p] || 0)
                            allVals.push((cogsMonths[p] || 0) + (sellingMonths[p] || 0) + (adminMonths[p] || 0) + (otherMonths[p] || 0) + (taxMonths[p] || 0))
                        }
                        const maxVal = Math.max(...allVals, 1)

                        return (
                            <div style={{ overflowX: 'auto' }}>
                                <svg width={svgW} height={chartH + 30} style={{ display: 'block' }}>
                                    {periods.map((p, pi) => {
                                        const x = pi * (barW * 2 + gap) + gap
                                        const revH = ((revMonths[p] || 0) / maxVal) * chartH
                                        const expTotal = (cogsMonths[p] || 0) + (sellingMonths[p] || 0) + (adminMonths[p] || 0) + (otherMonths[p] || 0) + (taxMonths[p] || 0)
                                        const expH = (expTotal / maxVal) * chartH
                                        return (
                                            <g key={p}>
                                                <rect x={x} y={chartH - revH} width={barW} height={revH} fill="#34D399" rx={3} opacity={0.85} />
                                                <rect x={x + barW + 2} y={chartH - expH} width={barW} height={expH} fill="#F87171" rx={3} opacity={0.85} />
                                                <text x={x + barW} y={chartH + 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                                                    {isMonth ? `T${parseInt(p)}` : p}
                                                </text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            </div>
                        )
                    })()}
                    <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#34D399' }} /> Doanh thu
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F87171' }} /> Chi phí
                        </div>
                    </div>
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

            {/* ── P&L Table ── */}
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
        </div>
    )
}
