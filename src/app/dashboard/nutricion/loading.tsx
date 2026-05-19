export default function NutricionLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      {/* Header */}
      <div className="h-7 w-44 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-52 bg-gray-100 rounded mb-6" />

      {/* Resumen de macros */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 w-12 bg-gray-200 rounded mx-auto mb-1" />
              <div className="h-3 w-10 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Comidas */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-2 border-t border-gray-100">
                <div className="h-3 w-36 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
