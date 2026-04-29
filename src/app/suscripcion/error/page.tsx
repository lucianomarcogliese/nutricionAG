import Link from 'next/link'

export default function SuscripcionErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ❌
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hubo un problema con el pago
        </h1>
        <p className="text-gray-500 mb-6">
          El pago no pudo completarse. No se realizó ningún cobro.
          Podés intentarlo de nuevo cuando quieras.
        </p>
        <Link
          href="/planes"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-8 py-3 transition-colors"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  )
}
