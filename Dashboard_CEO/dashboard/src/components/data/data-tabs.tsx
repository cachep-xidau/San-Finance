'use client'

import { useState, useMemo } from 'react'
import type { MasterDataRow, RawRevenueRow, RawExpenseRow } from '@/lib/queries/raw-data'

interface DataTabsProps {
    masterData: MasterDataRow[]
    revenueData: RawRevenueRow[]
    expenseData: RawExpenseRow[]
}

const CLINICS = ['Tất cả', 'San', 'Implant', 'Teennie']
const TABS = [
    { key: 'master', label: 'Master Data' },
    { key: 'revenue', label: 'Doanh thu' },
    { key: 'expenses', label: 'Chi phí' },
] as const

type TabKey = (typeof TABS)[number]['key']

function formatVND(amount: number): string {
    if (amount >= 1e9) return `₫${(amount / 1e9).toFixed(2)} tỷ`
    if (amount >= 1e6) return `₫${(amount / 1e6).toFixed(1)} tr`
    if (amount > 0) return `₫${amount.toLocaleString('vi-VN')}`
    return '0'
}

const PAGE_SIZE = 50

export function DataTabs({ masterData, revenueData, expenseData }: DataTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('revenue')
    const [clinic, setClinic] = useState('Tất cả')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    // Reset page when filter changes
    const handleClinicChange = (c: string) => { setClinic(c); setPage(1) }
    const handleTabChange = (t: TabKey) => { setActiveTab(t); setPage(1); setSearch('') }
    const handleSearch = (s: string) => { setSearch(s); setPage(1) }

    // Filter data
    const filteredRevenue = useMemo(() => {
        let data = clinic === 'Tất cả' ? revenueData : revenueData.filter(r => r.clinic === clinic)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(r => r.date.toLowerCase().includes(q) || r.month.toLowerCase().includes(q))
        }
        return data
    }, [revenueData, clinic, search])

    const filteredExpenses = useMemo(() => {
        let data = clinic === 'Tất cả' ? expenseData : expenseData.filter(r => r.clinic === clinic)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(r =>
                r.description.toLowerCase().includes(q) ||
                r.classify.toLowerCase().includes(q) ||
                r.finance.toLowerCase().includes(q)
            )
        }
        return data
    }, [expenseData, clinic, search])

    const currentData = activeTab === 'master' ? masterData
        : activeTab === 'revenue' ? filteredRevenue
            : filteredExpenses

    const totalPages = Math.ceil(currentData.length / PAGE_SIZE)
    const pagedData = currentData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div className="stack">
            {/* Tabs + Filters */}
            <div className="dashboard-section" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Tab buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: activeTab === tab.key ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                                    background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                                    color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                                    transition: 'all var(--transition-base)',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Clinic filter (hidden for Master Data) */}
                    {activeTab !== 'master' && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'auto' }}>
                            {CLINICS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleClinicChange(c)}
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
                    )}
                </div>

                {/* Search */}
                {activeTab !== 'master' && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                        <input
                            type="text"
                            placeholder={activeTab === 'revenue' ? 'Tìm theo ngày, tháng...' : 'Tìm theo nội dung, phân loại...'}
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
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
                )}
            </div>

            {/* Table */}
            <div className="dashboard-section" style={{ overflow: 'auto' }}>
                {activeTab === 'master' && <MasterTable data={pagedData as MasterDataRow[]} />}
                {activeTab === 'revenue' && <RevenueTable data={pagedData as RawRevenueRow[]} />}
                {activeTab === 'expenses' && <ExpenseTable data={pagedData as RawExpenseRow[]} />}

                {/* Pagination */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3) var(--space-4)',
                    borderTop: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                }}>
                    <span>{currentData.length.toLocaleString('vi-VN')} bản ghi</span>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: 'var(--space-1) var(--space-2)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: page === 1 ? 'var(--text-dim)' : 'var(--text-secondary)',
                                    cursor: page === 1 ? 'default' : 'pointer',
                                    fontSize: 'var(--text-xs)',
                                }}
                            >
                                ←
                            </button>
                            <span>{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    padding: 'var(--space-1) var(--space-2)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: page === totalPages ? 'var(--text-dim)' : 'var(--text-secondary)',
                                    cursor: page === totalPages ? 'default' : 'pointer',
                                    fontSize: 'var(--text-xs)',
                                }}
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Sub-tables ──────────────────────────────────── */

function MasterTable({ data }: { data: MasterDataRow[] }) {
    return (
        <table className="san-table">
            <thead>
                <tr>
                    <th className="san-th">Mã</th>
                    <th className="san-th">Phân loại</th>
                    <th className="san-th">Tài chính</th>
                    <th className="san-th">Dòng tiền</th>
                </tr>
            </thead>
            <tbody>
                {data.map(row => (
                    <tr key={row.id}>
                        <td className="san-td" style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-medium)' }}>{row.code}</td>
                        <td className="san-td">{row.classify}</td>
                        <td className="san-td">{row.category}</td>
                        <td className="san-td">
                            <span className="status-badge" style={{
                                background: row.expense_type === 'Biến phí' ? 'var(--success-bg)' : row.expense_type === 'Định phí' ? 'var(--warning-bg)' : 'var(--error-bg)',
                                color: row.expense_type === 'Biến phí' ? '#34D399' : row.expense_type === 'Định phí' ? '#FBBF24' : '#F87171',
                            }}>
                                {row.expense_type}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function RevenueTable({ data }: { data: RawRevenueRow[] }) {
    return (
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
                {data.map(row => (
                    <tr key={row.id}>
                        <td className="san-td" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.month}</td>
                        <td className="san-td" style={{ fontSize: 'var(--text-xs)' }}>{row.date}</td>
                        <td className="san-td">
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: 'var(--radius-sm)',
                                background: row.clinic === 'San' ? '#3B82F6' : row.clinic === 'Implant' ? '#10B981' : '#F59E0B',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'var(--weight-bold)',
                                marginRight: 'var(--space-2)',
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
    )
}

function ExpenseTable({ data }: { data: RawExpenseRow[] }) {
    return (
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
                {data.map(row => (
                    <tr key={row.id}>
                        <td className="san-td" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.month}</td>
                        <td className="san-td">
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: 'var(--radius-sm)',
                                background: row.clinic === 'San' ? '#3B82F6' : row.clinic === 'Implant' ? '#10B981' : '#F59E0B',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'var(--weight-bold)',
                                marginRight: 'var(--space-2)',
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
    )
}
