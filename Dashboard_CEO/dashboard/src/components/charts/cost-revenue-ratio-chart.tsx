'use client'

import { useState, useRef } from 'react'
import type { CostByClassify } from '@/lib/queries/cost-analysis-types'

interface TrendDataPoint {
    month: string
    monthLabel: string
    revenue: number
    costs: number
    profit: number
}

interface Props {
    costsByClassify: CostByClassify[]
    trendData: TrendDataPoint[]
}

const FIXED_CLASSIFY = new Set([
    'Lương cố định bộ phận văn phòng', 'Thuê mặt bằng', 'Bảo hiểm',
    'Điện, nước, wifi', 'Chi phí phần mềm (CRM, kế toán, cloud)',
    'Thuê bằng bác sĩ', 'Thuê xe, bãi xe', 'Đào tạo nhân sự',
    'Thuế GTGT/ TNCN/ TNDN/ môn bài/ lệ phí..nộp NSNN', 'Phường, quận',
])

export function CostRevenueRatioChart({ costsByClassify, trendData }: Props) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Use last 12 months from trendData for revenue
    const recentData = trendData.slice(-12)
    const monthKeys = recentData.map(d => d.month)
    const monthMMs = recentData.map(d => d.month.split('.')[1])

    const revByKey: Record<string, number> = {}
    for (const d of recentData) {
        revByKey[d.month] = (revByKey[d.month] || 0) + d.revenue
    }

    const fixedByKey: Record<string, number> = {}
    const variableByKey: Record<string, number> = {}
    for (const c of costsByClassify) {
        const isFixed = FIXED_CLASSIFY.has(c.classify)
        for (const mk of monthKeys) {
            const v = c.months[mk] || 0
            if (v > 0) {
                if (isFixed) fixedByKey[mk] = (fixedByKey[mk] || 0) + v
                else variableByKey[mk] = (variableByKey[mk] || 0) + v
            }
        }
    }

    const fixedRatios = monthKeys.map(mk => {
        const r = revByKey[mk] || 0
        return r > 0 ? (fixedByKey[mk] || 0) / r * 100 : 0
    })
    const varRatios = monthKeys.map(mk => {
        const r = revByKey[mk] || 0
        return r > 0 ? (variableByKey[mk] || 0) / r * 100 : 0
    })
    const totalRatios = monthKeys.map((_, i) => fixedRatios[i] + varRatios[i])

    const maxPct = Math.max(...totalRatios, ...fixedRatios, ...varRatios, 10)
    const yMax = Math.ceil(maxPct / 10) * 10

    const chartW = 780, chartH = 300, leftPad = 40, rightPad = 10
    const plotW = chartW - leftPad - rightPad
    const stepX = plotW / (monthMMs.length - 1 || 1)
    const monthLabels = monthMMs.map(m => `T${parseInt(m)}`)

    const smoothPath = (values: number[]) => {
        const pts = values.map((v, i) => ({ x: leftPad + i * stepX, y: chartH - (v / yMax) * chartH }))
        if (pts.length < 2) return { d: '', pts }
        let d = `M${pts[0].x},${pts[0].y}`
        const tension = 0.3
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
            d += ` C${p1.x + (p2.x - p0.x) * tension},${p1.y + (p2.y - p0.y) * tension} ${p2.x - (p3.x - p1.x) * tension},${p2.y - (p3.y - p1.y) * tension} ${p2.x},${p2.y}`
        }
        return { d, pts }
    }

    const fixed = smoothPath(fixedRatios)
    const variable = smoothPath(varRatios)
    const total = smoothPath(totalRatios)
    const yTicks = Array.from({ length: (yMax / 10) + 1 }, (_, i) => i * 10)

    // Tooltip position: convert SVG coords to container %
    const getTooltipStyle = (idx: number): React.CSSProperties => {
        const xPct = ((leftPad + idx * stepX) / chartW) * 100
        const isRight = xPct > 60
        return {
            position: 'absolute',
            top: '10%',
            left: isRight ? undefined : `${xPct + 2}%`,
            right: isRight ? `${100 - xPct + 2}%` : undefined,
            zIndex: 10,
            pointerEvents: 'none',
        }
    }

    return (
        <div style={{ marginTop: 24, position: 'relative' }} ref={containerRef}>
            <div style={{ overflowX: 'auto' }}>
                <svg
                    viewBox={`0 0 ${chartW} ${chartH + 28}`}
                    width="100%"
                    style={{ display: 'block' }}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={leftPad} y1={chartH - (v / yMax) * chartH} x2={chartW - rightPad} y2={chartH - (v / yMax) * chartH} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                            <text x={leftPad - 4} y={chartH - (v / yMax) * chartH + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-report)' }}>{v}%</text>
                        </g>
                    ))}

                    {/* Hover guide line */}
                    {hoveredIdx !== null && (
                        <line
                            x1={leftPad + hoveredIdx * stepX}
                            y1={0}
                            x2={leftPad + hoveredIdx * stepX}
                            y2={chartH}
                            stroke="var(--text-muted)"
                            strokeWidth={1}
                            opacity={0.3}
                        />
                    )}

                    {total.d && <path d={total.d} fill="none" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" opacity={0.5} />}
                    {fixed.d && <path d={fixed.d} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinecap="round" />}
                    {variable.d && <path d={variable.d} fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeLinecap="round" />}

                    {/* Data points */}
                    {fixed.pts.map((pt, i) => fixedRatios[i] > 0 ? (
                        <g key={`f${i}`}>
                            <circle cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 5 : 3.5} fill="var(--bg-card)" stroke="#3B82F6" strokeWidth={2} />
                            {hoveredIdx !== i && <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="8" fill="#3B82F6" style={{ fontFamily: 'var(--font-report)' }}>{fixedRatios[i].toFixed(0)}%</text>}
                        </g>
                    ) : null)}
                    {variable.pts.map((pt, i) => varRatios[i] > 0 ? (
                        <g key={`v${i}`}>
                            <circle cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 5 : 3.5} fill="var(--bg-card)" stroke="#F59E0B" strokeWidth={2} />
                            {hoveredIdx !== i && <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="8" fill="#F59E0B" style={{ fontFamily: 'var(--font-report)' }}>{varRatios[i].toFixed(0)}%</text>}
                        </g>
                    ) : null)}
                    {/* Total CP/DT dots */}
                    {total.pts.map((pt, i) => totalRatios[i] > 0 ? (
                        <circle key={`t${i}`} cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 4 : 2.5} fill="#EF4444" opacity={hoveredIdx === i ? 0.7 : 0.4} />
                    ) : null)}

                    {/* Invisible hover zones */}
                    {monthLabels.map((_, i) => (
                        <rect
                            key={`hz${i}`}
                            x={leftPad + i * stepX - stepX / 2}
                            y={0}
                            width={stepX}
                            height={chartH}
                            fill="transparent"
                            onMouseEnter={() => setHoveredIdx(i)}
                        />
                    ))}

                    {/* X axis */}
                    {monthLabels.map((m, i) => (
                        <text key={i} x={leftPad + i * stepX} y={chartH + 16} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{m}</text>
                    ))}
                </svg>
            </div>

            {/* Tooltip overlay */}
            {hoveredIdx !== null && (
                <div style={getTooltipStyle(hoveredIdx)}>
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: 160,
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{monthKeys[hoveredIdx]}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '2px 0' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Định phí/DT:</span>
                            <span style={{ fontWeight: 500, color: '#3B82F6' }}>{fixedRatios[hoveredIdx].toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '2px 0' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Biến phí/DT:</span>
                            <span style={{ fontWeight: 500, color: '#F59E0B' }}>{varRatios[hoveredIdx].toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '2px 0' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', opacity: 0.6, display: 'inline-block' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Tổng CP/DT:</span>
                            <span style={{ fontWeight: 500, color: '#EF4444' }}>{totalRatios[hoveredIdx].toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: '#3B82F6' }} /> Định phí / Doanh thu
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: '#F59E0B' }} /> Biến phí / Doanh thu
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: '#EF4444', opacity: 0.5 }} /> Tổng CP / Doanh thu
                </div>
            </div>
        </div>
    )
}
