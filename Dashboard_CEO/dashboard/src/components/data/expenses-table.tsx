'use client'

import { useState, useMemo } from 'react'
import type { RawExpenseRow } from '@/lib/queries/raw-data'

const CLINICS = ['Tất cả', 'San', 'Implant', 'Teennie']
const PAGE_SIZE = 50

function formatVND(amount: number): string {
    if (amount >= 1e9) return `₫${(amount / 1e9).toFixed(2)} tỷ`
    if (amount >= 1e6) return `₫${(amount / 1e6).toFixed(1)} tr`
    if (amount > 0) return `₫${amount.toLocaleString('vi-VN')}`
    return '0'
}

export function ExpensesTable({ data }: { data: RawExpenseRow[] }) {
    const [clinic, setClinic] = useState('Tất cả')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let d = clinic === 'Tất cả' ? data : data.filter(r => r.clinic === clinic)
        if (search) {
            const q = search.toLowerCase()
            d = d.filter(r =>
                r.description.toLowerCase().includes(q) ||
                r.classify.toLowerCase().includes(q) ||
                r.finance.toLowerCase().includes(q)
            )
        }
        return d
    }, [data, clinic, search])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            {/* Filters */}
            <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {CLINICS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setClinic(c); setPage(1) }}
                                style={{
                                    padding: 'var(--space-1) var(--space-3)',
                                    borderRadius: 'var(--radius-full)',
                                    border: `1px solid ${clinic === c ? 'var(--accent)' : 'var(--border)'}`,
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: clinic === c ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                                    background: clinic === c ? 'var(--primary-bg)' : 'transparent',
                                    color: clinic === c ? 'var(--accent)' : 'var(--text-muted)',
                                    transition: 'all var(--transition-base)',
                                }}
                            >
                                {c === 'Tất cả' ? 'Tất cả' : `Nha khoa ${c}`}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo nội dung, phân loại..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        style={{
                            marginLeft: 'auto',
                            maxWidth: '260px',
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="dashboard-section" style={{ overflow: 'auto' }}>
                <table className="san-table">
                    <thead>
                        <tr>
                            <th className="san-th">Tháng</th>
                            <th className="san-th">Chi nhánh</th>
                            <th className="san-th">Nội dung chi</th>
                            <th className="san-th">Phân loại</th>
                            <th className="san-th" style={{ textAlign: 'right' }}>Số tiền</th>
                            <th className="san-th">Dòng tiền</th>
                            <th className="san-th">Tài chính</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map(row => (
                            <tr key={row.id}>
                                <td className="san-td" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.month}</td>
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
                                <td className="san-td" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                                <td className="san-td" style={{ fontSize: 'var(--text-xs)' }}>{row.classify}</td>
                                <td className="san-td" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-bold)', color: '#F87171' }}>{formatVND(row.amount)}</td>
                                <td className="san-td">
                                    <span className="status-badge" style={{
                                        background: row.cash_flow === 'Biến phí' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                        color: row.cash_flow === 'Biến phí' ? '#34D399' : '#FBBF24',
                                    }}>
                                        {row.cash_flow}
                                    </span>
                                </td>
                                <td className="san-td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{row.finance}</td>
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
        </>
    )
}
