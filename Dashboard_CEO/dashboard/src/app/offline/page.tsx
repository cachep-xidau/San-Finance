import Link from 'next/link'
import { WifiOff, RefreshCcw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div
        className="w-full max-w-md p-6 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="inline-flex p-2 rounded-lg"
          style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
        >
          <WifiOff size={18} />
        </div>

        <h1 className="text-lg font-semibold mt-3" style={{ color: 'var(--text-main)' }}>
          Bạn đang ngoại tuyến
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Không thể tải dữ liệu mới. Kiểm tra kết nối mạng và thử lại.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
            style={{ background: 'var(--primary)' }}
          >
            <RefreshCcw size={16} />
            Thử lại kết nối
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-main)' }}
          >
            Về dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
