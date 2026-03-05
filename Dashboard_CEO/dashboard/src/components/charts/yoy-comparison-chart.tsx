'use client'

import { useState } from 'react'
import type { TrendDataPoint } from '@/lib/queries/trends'

interface Props {
    currentData: TrendDataPoint[]
    previousData: TrendDataPoint[]
}

type Metric = 'revenue' | 'profit' | 'margin'

const METRICS: { key: Metric; label: string; color: string }[] = [
    { key: 'revenue', label: 'Doanh thu', color: '#3B82F6' },
    { key: 'profit', label: 'Lợi nhuận ròng', color: '#10B981' },
    { key: 'margin', label: 'Biên lợi nhuận', color: '#8B5CF6' },
]

function formatValue(value: number, isPercent: boolean) {
    if (isPercent) return `${value.toFixed(1)}%`
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2).replace('.', ',')} tỷ`
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1).replace('.', ',')} tr`
    return `${(value / 1e3).toFixed(0)}K`
}

export function YoYComparisonChart({ currentData, previousData }: Props) {
    const [selectedMetric, setSelectedMetric] = useState<Metric>('revenue')
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const meta = METRICS.find(m => m.key === selectedMetric)!
    const isPercent = selectedMetric === 'margin'

    const months = currentData.map(d => {
        const mm = parseInt(d.month.split('.')[1])
        return `Th${mm}`
    })

    const getValue = (d: TrendDataPoint, metric: Metric) => {
        if (metric === 'revenue') return d.revenue
        if (metric === 'profit') return d.profit
        return d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0
    }

    const currentValues = currentData.map(d => getValue(d, selectedMetric))
    const previousValues = previousData.map(d => getValue(d, selectedMetric))

    const allValues = [...currentValues, ...previousValues].filter(v => v !== 0)
    const maxVal = Math.max(...allValues, 1)
    const minVal = Math.min(...allValues, 0)
    const yMax = isPercent ? Math.ceil(maxVal / 10) * 10 + 10 : maxVal * 1.15
    const yMin = isPercent ? Math.floor(minVal / 10) * 10 : Math.min(minVal * 1.15, 0)
    const yRange = yMax - yMin || 1

    const chartW = 780, chartH = 300, leftPad = 55, rightPad = 10
    const plotW = chartW - leftPad - rightPad
    const stepX = plotW / (months.length - 1 || 1)

    const toY = (v: number) => chartH - ((v - yMin) / yRange) * chartH

    const smoothPath = (values: number[]) => {
        const pts = values.map((v, i) => ({ x: leftPad + i * stepX, y: toY(v) }))
        if (pts.length < 2) return { d: '', pts }
        let d = `M${pts[0].x},${pts[0].y}`
        const tension = 0.3
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
            d += ` C${p1.x + (p2.x - p0.x) * tension},${p1.y + (p2.y - p0.y) * tension} ${p2.x - (p3.x - p1.x) * tension},${p2.y - (p3.y - p1.y) * tension} ${p2.x},${p2.y}`
        }
        return { d, pts }
    }

    const current = smoothPath(currentValues)
    const previous = smoothPath(previousValues)

    const tickCount = 5
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (yRange / tickCount) * i)

    const currentTotal = currentValues.reduce((a, b) => a + b, 0)
    const previousTotal = previousValues.reduce((a, b) => a + b, 0)
    const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

    // Tooltip position
    const getTooltipStyle = (idx: number): React.CSSProperties => {
        const xPct = ((leftPad + idx * stepX) / chartW) * 100
        const isRight = xPct > 60
        return {
            position: 'absolute',
            top: '15%',
            left: isRight ? undefined : `${xPct + 2}%`,
            right: isRight ? `${100 - xPct + 2}%` : undefined,
            zIndex: 10,
            pointerEvents: 'none',
        }
    }

    // YoY change for hovered point
    const getPointChange = (idx: number) => {
        const prev = previousValues[idx]
        const curr = currentValues[idx]
        if (!prev || prev === 0) return null
        return ((curr - prev) / prev) * 100
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Metric selector - positioned at top right, aligned with section title */}
            <div style={{ position: 'absolute', top: -38, right: 0, display: 'flex', gap: 'var(--space-2)' }}>
                {METRICS.map(m => {
                    const isActive = selectedMetric === m.key
                    return (
                        <button
                            key={m.key}
                            onClick={() => setSelectedMetric(m.key)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-pill)',
                                border: `1.5px solid ${isActive ? m.color : 'var(--border)'}`,
                                background: isActive ? m.color : 'var(--bg-card)',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-xs)',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 2px 8px ${m.color}40` : 'none',
                            }}
                        >
                            {m.label}
                        </button>
                    )
                })}
            </div>

            <div style={{ overflowX: 'auto', marginTop: 24 }}>
                <svg
                    viewBox={`0 0 ${chartW} ${chartH + 28}`}
                    width="100%"
                    style={{ display: 'block' }}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {/* Y gridlines */}
                    {yTicks.map((v, i) => (
                        <g key={i}>
                            <line x1={leftPad} y1={toY(v)} x2={chartW - rightPad} y2={toY(v)} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                            <text x={leftPad - 6} y={toY(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-report)' }}>
                                {formatValue(v, isPercent)}
                            </text>
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

                    {/* Fill area for current */}
                    {current.d && (
                        <path
                            d={`${current.d} L${leftPad + (currentValues.length - 1) * stepX},${toY(yMin)} L${leftPad},${toY(yMin)} Z`}
                            fill={meta.color}
                            opacity={0.08}
                        />
                    )}

                    {/* Previous year line (dashed) */}
                    {previous.d && (
                        <path d={previous.d} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" opacity={0.5} />
                    )}

                    {/* Current year line */}
                    {current.d && (
                        <path d={current.d} fill="none" stroke={meta.color} strokeWidth={2.5} strokeLinecap="round" />
                    )}

                    {/* Current data points */}
                    {current.pts.map((pt, i) => currentValues[i] !== 0 ? (
                        <g key={`c${i}`}>
                            {hoveredIdx === i && <circle cx={pt.x} cy={pt.y} r={8} fill={meta.color} opacity={0.15} />}
                            <circle cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 5 : 3.5} fill="var(--bg-card)" stroke={meta.color} strokeWidth={2} />
                        </g>
                    ) : null)}

                    {/* Previous data points */}
                    {previous.pts.map((pt, i) => previousValues[i] !== 0 ? (
                        <g key={`p${i}`}>
                            {hoveredIdx === i && <circle cx={pt.x} cy={pt.y} r={6} fill="var(--text-muted)" opacity={0.1} />}
                            <circle cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 4 : 2.5} fill="var(--text-muted)" opacity={hoveredIdx === i ? 0.7 : 0.4} />
                        </g>
                    ) : null)}

                    {/* Invisible hover zones */}
                    {months.map((_, i) => (
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
                    {months.map((m, i) => (
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
                        minWidth: 180,
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{months[hoveredIdx]}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '2px 0' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Năm nay:</span>
                            <span style={{ fontWeight: 500, color: meta.color }}>{formatValue(currentValues[hoveredIdx], isPercent)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '2px 0' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.5, display: 'inline-block' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Năm trước:</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{formatValue(previousValues[hoveredIdx], isPercent)}</span>
                        </div>
                        {(() => {
                            const change = getPointChange(hoveredIdx)
                            if (change === null) return null
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', padding: '4px 0 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Thay đổi:</span>
                                    <span style={{ fontWeight: 600, color: change >= 0 ? '#10B981' : '#EF4444' }}>
                                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                    </span>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 14, height: 3, borderRadius: 2, background: meta.color }} /> Năm nay
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <div style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--text-muted)', opacity: 0.5 }} /> Cùng kỳ năm trước
                </div>
            </div>
        </div>
    )
}
