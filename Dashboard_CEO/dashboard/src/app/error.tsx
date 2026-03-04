'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 448,
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', color: 'var(--red)' }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Đã xảy ra lỗi</h1>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', color: 'var(--text-muted)' }}>
              Hệ thống gặp lỗi không mong muốn. Vui lòng thử lại.
            </p>
            {error?.digest && (
              <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)', color: 'var(--text-muted)' }}>
                Mã lỗi: {error.digest}
              </p>
            )}
            <button onClick={reset} className="btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              <RotateCcw size={16} />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
