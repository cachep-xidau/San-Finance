'use client'

import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          className="p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--background)' }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg hover:opacity-80 transition-opacity relative"
          style={{ background: 'var(--background)' }}
        >
          <Bell size={18} style={{ color: 'var(--text-muted)' }} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--danger)' }}
          />
        </button>

        {/* User */}
        <button
          className="flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--background)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            <User size={16} className="text-white" />
          </div>
        </button>
      </div>
    </header>
  )
}
