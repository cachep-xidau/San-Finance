'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const errorMessage = error.message.toLowerCase()

        if (errorMessage.includes('failed to fetch')) {
          setError('Không thể kết nối máy chủ đăng nhập. Kiểm tra cấu hình Supabase hoặc khởi động Supabase local.')
          return
        }

        setError(
          error.message === 'Invalid login credentials'
            ? 'Email hoặc mật khẩu không đúng'
            : error.message
        )
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && error.message.toLowerCase().includes('fetch'))

      setError(
        isNetworkError
          ? 'Không thể kết nối máy chủ đăng nhập. Kiểm tra cấu hình Supabase hoặc khởi động Supabase local.'
          : 'Đăng nhập thất bại. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            S Group Dashboard
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Form */}
        <div className="p-6 rounded-xl shadow-sm" style={{ background: 'var(--surface)' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-main)'
                }}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-main)'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Quên mật khẩu? Liên hệ quản trị viên
        </p>
      </div>
    </div>
  )
}
