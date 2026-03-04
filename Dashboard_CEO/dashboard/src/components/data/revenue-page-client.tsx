'use client'

import { useState, useMemo } from 'react'
import { startOfWeek, startOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns'
import type { RawRevenueRow } from '@/lib/queries/raw-data'
import { ClinicCards } from './clinic-cards'
import { SyncBar } from './sync-bar'
import { SyncLogDrawer } from './sync-log-drawer'
import { DataFilterBar } from './data-filter-bar'

const PAGE_SIZE = 50

function formatVND(amount: number): string {
    if (amount >= 1e9) return `₫${(amount / 1e9).toFixed(2)} tỷ`
    if (amount >= 1e6) return `₫${(amount / 1e6).toFixed(1)} tr`
    if (amount > 0) return `₫${amount.toLocaleString('vi-VN')}`
    return '0'
}

function parseDate(dateStr: string): Date | null {
    // Format: dd/MM/yyyy
    const parts = dateStr.split('/')
    if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0])
    return null
}

interface RevenuePageClientProps {
    data: RawRevenueRow[]
    lastSync: string | null
}

export function RevenuePageClient({ data, lastSync }: RevenuePageClientProps) {
    const [logOpen, setLogOpen] = useState(false)
    const [selectedClinic, setSelectedClinic] = useState('')
    const [timePreset, setTimePreset] = useState('all')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [page, setPage] = useState(1)

    const filtered = useMemo(() => {
        let d = data

        // Clinic filter
        if (selectedClinic) {
            d = d.filter(r => r.clinic === selectedClinic)
        }

        // Time filter
        const now = new Date()
        if (timePreset === 'week') {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 })
            d = d.filter(r => { const dt = parseDate(r.date); return dt && dt >= weekStart })
        } else if (timePreset === 'month') {
            const monthStart = startOfMonth(now)
            d = d.filter(r => { const dt = parseDate(r.date); return dt && dt >= monthStart })
        } else if (timePreset === '3months') {
            const threeMonths = subMonths(now, 3)
            d = d.filter(r => { const dt = parseDate(r.date); return dt && dt >= threeMonths })
        } else if (dateFrom || dateTo) {
            const from = dateFrom ? new Date(dateFrom) : new Date('2000-01-01')
            const to = dateTo ? new Date(dateTo) : new Date('2099-12-31')
            d = d.filter(r => {
                const dt = parseDate(r.date)
                return dt && dt >= from && dt <= to
            })
        }

        return d
    }, [data, selectedClinic, timePreset, dateFrom, dateTo])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Reset page on filter change
    const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
        setter(v)
        setPage(1)
    }

    return (
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        Doanh thu
                    </h1>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Doanh thu hàng ngày 3 chi nhánh
                    </p>
                </div>
                <SyncBar lastSync={lastSync} onOpenLog={() => setLogOpen(true)} />
            </div>

            {/* Clinic cards */}
            <ClinicCards
                selectedClinic={selectedClinic}
                onSelectClinic={handleFilterChange(setSelectedClinic)}
                data={data}
                type="revenue"
            />

            {/* Filter bar */}
            <DataFilterBar
                timePreset={timePreset}
                onTimePreset={handleFilterChange(setTimePreset)}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFrom={handleFilterChange(setDateFrom)}
                onDateTo={handleFilterChange(setDateTo)}
                finance=""
                classify=""
                onFinance={() => { }}
                onClassify={() => { }}
                recordCount={filtered.length}
            />

            {/* Table */}
            <div className="dashboard-section" style={{ overflow: 'auto' }}>
                <table className="san-table">
                    <thead>
                        <tr>
                            <th className="san-th">Tháng</th>
                            <th className="san-th">Ngày</th>
                            <th className="san-th">Chi nhánh</th>
                            <th className="san-th" style={{ textAlign: 'right' }}>Tiền mặt</th>
                            <th className="san-th" style={{ textAlign: 'right' }}>Cà thẻ</th>
                            <th className="san-th" style={{ textAlign: 'right' }}>Chuyển khoản</th>
                            <th className="san-th" style={{ textAlign: 'right' }}>Trả góp</th>
                            <th className="san-th" style={{ textAlign: 'right', fontWeight: 'var(--weight-bold)' }}>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map(row => (
                            <tr key={row.id}>
                                <td className="san-td" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.month}</td>
                                <td className="san-td" style={{ fontSize: 'var(--text-xs)' }}>{row.date}</td>
                                <td className="san-td">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: '24px', height: '24px', borderRadius: 'var(--radius-sm)',
                                        background: row.clinic === 'San' ? '#3B82F6' : row.clinic === 'Implant' ? '#10B981' : '#F59E0B',
                                        color: 'white', fontSize: '10px', fontWeight: 'var(--weight-bold)', marginRight: 'var(--space-2)',
                                    }}>
                                        {row.clinic[0]}
                                    </span>
                                    {row.clinic}
                                </td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatVND(row.cash)}</td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatVND(row.card)}</td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatVND(row.transfer)}</td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatVND(row.installment)}</td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{formatVND(row.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                }}>
                    <span>{filtered.length.toLocaleString('vi-VN')} bản ghi</span>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: page === 1 ? 'var(--text-dim)' : 'var(--text-secondary)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 'var(--text-xs)' }}>←</button>
                            <span>{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: page === totalPages ? 'var(--text-dim)' : 'var(--text-secondary)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 'var(--text-xs)' }}>→</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sync Log Drawer */}
            <SyncLogDrawer open={logOpen} onClose={() => setLogOpen(false)} />
        </div>
    )
}
