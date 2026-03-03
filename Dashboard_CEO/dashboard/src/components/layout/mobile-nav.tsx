'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Wallet, FileText, User } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/clinics', label: 'Chi nhánh', icon: Building2 },
  { href: '/budget', label: 'Ngân sách', icon: Wallet },
  { href: '/reports', label: 'Báo cáo', icon: FileText },
  { href: '/settings', label: 'Cài đặt', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]"
            >
              <Icon
                size={20}
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                }}
              />
              <span
                className="text-xs"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
