'use client'

import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        {/* Search */}
        <button className="btn-icon" aria-label="Search">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="btn-icon" style={{ position: 'relative' }} aria-label="Notifications">
          <Bell size={18} />
          <span
            className="animate-pulse-dot"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--red)',
            }}
          />
        </button>

        {/* User */}
        <button className="btn-icon" style={{ borderRadius: 'var(--radius-lg)' }} aria-label="Profile">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={14} style={{ color: 'white' }} />
          </div>
        </button>
      </div>
    </header>
  )
}
