import { getMasterData, getDataStats } from '@/lib/queries/raw-data'

export const dynamic = 'force-dynamic'

// Group master data by category
function groupByCategory(data: Awaited<ReturnType<typeof getMasterData>>) {
    const groups: Record<string, typeof data> = {}
    for (const row of data) {
        if (!groups[row.category]) groups[row.category] = []
        groups[row.category].push(row)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    '1': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA' },
    '2': { bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC' },
    '3': { bg: 'rgba(20, 184, 166, 0.12)', text: '#2DD4BF' },
    '4': { bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24' },
    '5': { bg: 'rgba(239, 68, 68, 0.12)', text: '#F87171' },
    '6': { bg: 'rgba(107, 114, 128, 0.12)', text: '#9CA3AF' },
}

function getCategoryColor(category: string) {
    const num = category.charAt(0)
    return CATEGORY_COLORS[num] || { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
}

export default async function MasterDataPage() {
    const [masterData, stats] = await Promise.all([
        getMasterData(),
        getDataStats(),
    ])

    const grouped = groupByCategory(masterData)

    return (
        <div className="stack">
            {/* Header */}
            <div className="san-page-header">
                <div>
                    <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        Master Data
                    </h1>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Danh mục chi phí — {stats.masterCount} hạng mục · {grouped.length} nhóm
                    </p>
                </div>
            </div>

            {/* Category Groups */}
            {grouped.map(([category, rows]) => {
                const color = getCategoryColor(category)
                return (
                    <div key={category} className="dashboard-section" style={{ overflow: 'auto' }}>
                        {/* Category Header */}
                        <div style={{
                            padding: 'var(--space-3) var(--space-4)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                        }}>
                            <span style={{
                                background: color.bg,
                                color: color.text,
                                padding: '2px 10px',
                                borderRadius: '6px',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 'var(--weight-semibold)',
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.02em',
                            }}>
                                {rows[0].code.split('.')[0]}
                            </span>
                            <span style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--weight-semibold)',
                                color: 'var(--text-primary)',
                            }}>
                                {category}
                            </span>
                            <span style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                marginLeft: 'auto',
                            }}>
                                {rows.length} hạng mục
                            </span>
                        </div>

                        {/* Table */}
                        <table className="san-table">
                            <thead>
                                <tr>
                                    <th className="san-th" style={{ width: '120px' }}>Mã</th>
                                    <th className="san-th">Phân loại</th>
                                    <th className="san-th" style={{ width: '100px' }}>Dòng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.id}>
                                        <td className="san-td" style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 'var(--weight-medium)',
                                            fontSize: 'var(--text-xs)',
                                            color: color.text,
                                        }}>
                                            {row.code}
                                        </td>
                                        <td className="san-td">{row.classify}</td>
                                        <td className="san-td">
                                            <span className="status-badge" style={{
                                                background: row.expense_type === 'Biến phí' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                                color: row.expense_type === 'Biến phí' ? '#34D399' : '#FBBF24',
                                            }}>
                                                {row.expense_type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            })}
        </div>
    )
}
