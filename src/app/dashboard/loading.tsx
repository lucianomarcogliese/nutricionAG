export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded hidden sm:block animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
        {/* Greeting */}
        <div className="h-7 w-56 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-32 bg-gray-100 rounded mb-6" />

        {/* Stats grid — 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-28" />
          ))}
        </div>

        {/* Próximo turno */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-20" />
        </div>
      </div>
    </div>
  )
}
