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
    <html lang="vi">
      <body
        style={{
          background: 'var(--background)',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div className="min-h-screen flex items-center justify-center p-6">
          <div
            className="w-full max-w-md p-6 rounded-2xl border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                <AlertTriangle size={18} />
              </div>

              <div className="flex-1">
                <h1 className="text-lg font-semibold">Đã xảy ra lỗi</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Hệ thống gặp lỗi không mong muốn. Vui lòng thử lại.
                </p>

                {error?.digest && (
                  <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                    Mã lỗi: {error.digest}
                  </p>
                )}

                <button
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  <RotateCcw size={16} />
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
