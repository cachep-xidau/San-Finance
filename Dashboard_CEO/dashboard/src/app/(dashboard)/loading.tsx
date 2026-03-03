export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded-md" style={{ background: 'var(--surface)' }} />
        <div className="h-4 w-32 rounded-md mt-2" style={{ background: 'var(--surface)' }} />
      </div>

      <div className="flex gap-3">
        <div className="h-10 w-48 rounded-lg" style={{ background: 'var(--surface)' }} />
        <div className="h-10 w-40 rounded-lg" style={{ background: 'var(--surface)' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[320px] rounded-xl" style={{ background: 'var(--surface)' }} />
        <div className="h-[320px] rounded-xl" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )
}
