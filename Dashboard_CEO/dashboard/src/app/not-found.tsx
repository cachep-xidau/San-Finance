import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div
        className="w-full max-w-md p-6 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
          404
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Không tìm thấy trang bạn đang truy cập.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Home size={16} />
            Về trang chủ
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
          >
            <ArrowLeft size={16} />
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
