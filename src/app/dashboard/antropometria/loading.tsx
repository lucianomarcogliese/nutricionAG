export default function AntropometriaLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      {/* Header */}
      <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />

      {/* Métricas principales — grid 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Sección de medidas detalladas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-28 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
