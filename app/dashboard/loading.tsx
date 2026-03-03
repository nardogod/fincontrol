export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-48" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}
