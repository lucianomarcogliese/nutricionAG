import Link from 'next/link'

export default function SuscripcionPendientePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ⏳
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tu pago está siendo procesado
        </h1>
        <p className="text-gray-500 mb-2">
          MercadoPago está verificando tu pago. Esto puede demorar unos minutos.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Cuando se confirme, tu plan se activará automáticamente y recibirás una notificación.
          No es necesario hacer nada más.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-8 py-3 transition-colors"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
