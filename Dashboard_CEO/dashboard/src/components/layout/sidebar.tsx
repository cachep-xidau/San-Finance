'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Database,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/reports/expenses', label: 'Báo cáo chi phí', icon: BarChart3 },
  { href: '/reports/pnl', label: 'Báo cáo Lãi Lỗ', icon: TrendingUp },
  {
    label: 'Dữ liệu',
    icon: Database,
    children: [
      { href: '/data/master', label: 'Master data', icon: FileSpreadsheet },
      { href: '/data/revenue', label: 'Doanh thu', icon: TrendingUp },
      { href: '/data/expenses', label: 'Chi phí', icon: TrendingDown },
    ],
  },
  { href: '/budget', label: 'Ngân sách', icon: Wallet },
  { href: '/login', label: 'Tài khoản', icon: Settings },
]

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const theme = saved || 'dark'
    setIsDark(theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const toggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }, [isDark])

  return (
    <button
      onClick={toggle}
      className="nav-item"
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="nav-label">{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span>
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [dataOpen, setDataOpen] = useState(() => pathname.startsWith('/data'))
  const router = useRouter()
  const supabase = createClient()

  // Auto-open data submenu when navigating to /data/*
  useEffect(() => {
    if (pathname.startsWith('/data')) setDataOpen(true)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        {!collapsed && <span className="logo-text">S Group</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          // Expandable group (Dữ liệu)
          if ('children' in item) {
            const Icon = item.icon
            const isGroupActive = pathname.startsWith('/data')

            return (
              <div key={item.label}>
                <button
                  onClick={() => setDataOpen(!dataOpen)}
                  className={`nav-item${isGroupActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={{ width: '100%' }}
                >
                  <Icon size={18} />
                  <span className="nav-label" style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {!collapsed && (
                    <ChevronDown
                      size={14}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: dataOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        opacity: 0.5,
                      }}
                    />
                  )}
                </button>

                {/* Sub-menu */}
                {dataOpen && !collapsed && (
                  <div className="nav-submenu">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon
                      const isActive = pathname === child.href

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`nav-item nav-item-sub${isActive ? ' active' : ''}`}
                        >
                          <ChildIcon size={15} />
                          <span className="nav-label">{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Regular nav item
          const navItem = item as { href: string; label: string; icon: typeof LayoutDashboard }
          const Icon = navItem.icon
          const targetPath = navItem.href.split('#')[0] || '/'
          const isActive =
            targetPath === '/'
              ? pathname === '/'
              : pathname === targetPath || pathname.startsWith(`${targetPath}/`)

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className={`nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? navItem.label : undefined}
            >
              <Icon size={18} />
              <span className="nav-label">{navItem.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Theme Toggle + Logout */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ThemeToggle collapsed={collapsed} />
        <div style={{ padding: '0 var(--space-2) var(--space-2)' }}>
          <button onClick={handleLogout} className="nav-item">
            <LogOut size={18} />
            <span className="nav-label">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
