export default function MensajesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse">
      {/* Sidebar de conversaciones */}
      <div className="w-72 shrink-0 border-r border-gray-200 bg-white p-4 space-y-3 hidden sm:block">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col bg-gray-50 p-4">
        {/* Header del chat */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-full" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>

        {/* Burbujas de mensaje */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-start">
            <div className="h-10 w-48 bg-white border border-gray-200 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-56 bg-emerald-100 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <div className="h-16 w-64 bg-white border border-gray-200 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-40 bg-emerald-100 rounded-2xl" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mt-4 h-12" />
      </div>
    </div>
  )
}
