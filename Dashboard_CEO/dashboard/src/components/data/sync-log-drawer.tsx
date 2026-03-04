'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SyncLog {
    id: number
    started_at: string
    completed_at: string | null
    status: string
    duration_ms: number | null
    details: {
        revenue?: { inserted: number; skipped: number }
        expenses?: { inserted: number; skipped: number }
    } | null
}

interface SyncLogDrawerProps {
    open: boolean
    onClose: () => void
}

export function SyncLogDrawer({ open, onClose }: SyncLogDrawerProps) {
    const [logs, setLogs] = useState<SyncLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!open) return
        const fetchLogs = async () => {
            setLoading(true)
            const supabase = createClient()
            const { data } = await supabase
                .from('sync_logs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(20)
            setLogs((data as unknown as SyncLog[]) || [])
            setLoading(false)
        }
        fetchLogs()
    }, [open])

    if (!open) return null

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 998,
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* Drawer */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                background: 'var(--bg-card)',
                borderLeft: '1px solid var(--border)',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.3s ease',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4) var(--space-5)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        Lịch sử Sync
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Log list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                        </div>
                    ) : logs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>
                            Chưa có lịch sử sync
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {logs.map(log => (
                                <div
                                    key={log.id}
                                    style={{
                                        padding: 'var(--space-4)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)',
                                    }}
                                >
                                    {/* Status + Time */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            {log.status === 'success' ? (
                                                <CheckCircle size={16} style={{ color: '#34D399' }} />
                                            ) : log.status === 'error' ? (
                                                <AlertCircle size={16} style={{ color: '#F87171' }} />
                                            ) : (
                                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                                            )}
                                            <span style={{
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 'var(--weight-medium)',
                                                color: log.status === 'success' ? '#34D399' : log.status === 'error' ? '#F87171' : 'var(--accent)',
                                                textTransform: 'capitalize',
                                            }}>
                                                {log.status === 'success' ? 'Thành công' : log.status === 'error' ? 'Lỗi' : 'Đang chạy'}
                                            </span>
                                        </div>
                                        {log.duration_ms && (
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {(log.duration_ms / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                                        {new Date(log.started_at).toLocaleString('vi-VN')}
                                    </div>

                                    {/* Details breakdown */}
                                    {log.details && (
                                        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                            {log.details.revenue && (
                                                <div>
                                                    <span style={{ color: '#10B981' }}>Doanh thu:</span>{' '}
                                                    +{log.details.revenue.inserted}
                                                </div>
                                            )}
                                            {log.details.expenses && (
                                                <div>
                                                    <span style={{ color: '#F59E0B' }}>Chi phí:</span>{' '}
                                                    +{log.details.expenses.inserted}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
