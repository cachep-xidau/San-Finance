export default function DashboardLoading() {
  return (
    <div className="stack">
      <div>
        <div className="skeleton-shimmer" style={{ height: 28, width: 160, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton-shimmer" style={{ height: 16, width: 128, borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <div className="skeleton-shimmer" style={{ height: 40, width: 192 }} />
        <div className="skeleton-shimmer" style={{ height: 40, width: 160 }} />
      </div>

      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 112, animationDelay: `${i * 80}ms` }} />
        ))}
      </div>

      <div className="grid-2">
        <div className="skeleton-shimmer" style={{ height: 320 }} />
        <div className="skeleton-shimmer" style={{ height: 320 }} />
      </div>
    </div>
  )
}
