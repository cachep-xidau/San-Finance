import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
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
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
          404
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', color: 'var(--text-muted)' }}>
          Không tìm thấy trang bạn đang truy cập.
        </p>

        <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/" className="btn-primary btn-sm">
            <Home size={16} />
            Về trang chủ
          </Link>
          <Link href="/login" className="btn btn-sm">
            <ArrowLeft size={16} />
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
