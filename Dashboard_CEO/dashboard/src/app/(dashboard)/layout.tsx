import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <Header title="Tổng quan tài chính" />
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
