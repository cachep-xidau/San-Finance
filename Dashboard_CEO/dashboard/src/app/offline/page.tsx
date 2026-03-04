import Link from 'next/link'
import { WifiOff, RefreshCcw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
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
        <div style={{ display: 'inline-flex', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
          <WifiOff size={18} />
        </div>

        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginTop: 'var(--space-3)', color: 'var(--text-primary)' }}>
          Bạn đang ngoại tuyến
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', color: 'var(--text-muted)' }}>
          Không thể tải dữ liệu mới. Kiểm tra kết nối mạng và thử lại.
        </p>

        <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/" className="btn-primary btn-sm">
            <RefreshCcw size={16} />
            Thử lại kết nối
          </Link>
          <Link href="/" className="btn btn-sm">
            Về dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
