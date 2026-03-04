'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NETWORK_ERROR_MESSAGE =
  'Không thể kết nối máy chủ đăng nhập. Kiểm tra cấu hình Supabase hoặc khởi động Supabase local.'
const GENERIC_ERROR_MESSAGE = 'Đăng nhập thất bại. Vui lòng thử lại.'
const INVALID_CREDENTIALS_MESSAGE = 'Email hoặc mật khẩu không đúng'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (activeTab === 'register') return

    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('failed to fetch')) {
          setError(NETWORK_ERROR_MESSAGE)
          return
        }
        setError(error.message === 'Invalid login credentials' ? INVALID_CREDENTIALS_MESSAGE : error.message)
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes('fetch'))
      setError(isNetworkError ? NETWORK_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary, #0F1117)',
        fontFamily: 'var(--font-primary)',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card, #1C2333)',
          padding: '40px 36px 36px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          Nexus Hub
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            marginBottom: 24,
          }}
        >
          Enter your credentials to continue.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'login' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'login' ? '#FFFFFF' : 'var(--text-muted)',
              outline: activeTab === 'login' ? '1px solid rgba(255,255,255,0.15)' : 'none',
              transition: 'all var(--transition-fast)',
              fontFamily: 'inherit',
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'register' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'register' ? '#FFFFFF' : 'var(--text-muted)',
              outline: activeTab === 'register' ? '1px solid rgba(255,255,255,0.15)' : 'none',
              transition: 'all var(--transition-fast)',
              fontFamily: 'inherit',
            }}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--red)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div style={{ marginBottom: 16 }}>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="Email"
              style={{
                width: '100%',
                height: 48,
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 24 }}>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Password"
              style={{
                width: '100%',
                height: 48,
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
