export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white px-5 py-6 shadow-xl shadow-slate-200 ring-1 ring-slate-200/80">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Your Mobile View</h1>
        </header>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
