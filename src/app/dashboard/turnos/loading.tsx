export default function TurnosLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="h-7 w-40 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-56 bg-gray-100 rounded mb-6" />

      {/* Turno cards */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
