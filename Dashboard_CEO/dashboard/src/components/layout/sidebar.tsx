'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Wallet,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/clinics', label: 'Chi nhánh', icon: Building2 },
  { href: '/budget', label: 'Ngân sách', icon: Wallet },
  { href: '/reports', label: 'Báo cáo', icon: FileText },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col border-r transition-all duration-300 z-40"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 h-16 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {!collapsed && (
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
            S Group
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--background)' }}
        >
          {collapsed ? (
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? '' : 'hover:opacity-80'
              }`}
              style={{
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:opacity-80 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
