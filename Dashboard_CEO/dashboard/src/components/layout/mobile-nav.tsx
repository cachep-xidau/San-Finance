'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Settings } from 'lucide-react'

const mobileNavItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/budget', label: 'Ngân sách', icon: Wallet },
  { href: '/login', label: 'Tài khoản', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 'var(--space-2) 0',
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}
      className="mobile-nav"
    >
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const targetPath = item.href.split('#')[0] || '/'
        const isActive =
          targetPath === '/' ? pathname === '/' : pathname === targetPath || pathname.startsWith(`${targetPath}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem',
              fontSize: 'var(--text-2xs)',
              fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none',
              cursor: 'pointer',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      <style>{`
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
