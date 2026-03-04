'use client'

import { useState } from 'react'
import { RefreshCw, Clock } from 'lucide-react'

interface SyncBarProps {
    lastSync?: string | null
    onOpenLog: () => void
}

export function SyncBar({ lastSync, onOpenLog }: SyncBarProps) {
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSync = async () => {
        setSyncing(true)
        setError(null)
        try {
            const res = await fetch('/api/sync', { method: 'POST' })
            if (!res.ok) throw new Error('Sync failed')
            // Reload page to show fresh data
            window.location.reload()
        } catch (err) {
            setError('Sync thất bại')
            setSyncing(false)
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Last sync info */}
            {lastSync && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Sync gần nhất: {new Date(lastSync).toLocaleString('vi-VN')}
                </span>
            )}

            {error && (
                <span style={{ fontSize: 'var(--text-xs)', color: '#F87171' }}>{error}</span>
            )}

            {/* Sync Data button */}
            <button
                onClick={handleSync}
                disabled={syncing}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: syncing ? 'wait' : 'pointer',
                    opacity: syncing ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                }}
            >
                <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Đang sync...' : 'Sync Data'}
            </button>

            {/* Log Data button */}
            <button
                onClick={onOpenLog}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <Clock size={14} />
                Log Data
            </button>
        </div>
    )
}
