import Link from "next/link"
import Image from "next/image"
import { getLandingContent } from "@/lib/landing-seed"
import { prisma } from "@/lib/prisma"

interface Testimonio {
  id: string
  nombre: string
  antesUrl: string
  despuesUrl: string
  kilos: number | null
  meses: number | null
  testimonio: string | null
  objetivo: string | null
}

async function getTestimonios(): Promise<Testimonio[]> {
  try {
    return await prisma.testimonio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true, antesUrl: true, despuesUrl: true, kilos: true, meses: true, testimonio: true, objetivo: true },
    })
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const [data, testimonios] = await Promise.all([getLandingContent(), getTestimonios()])

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <span className="text-emerald-600 font-bold text-xl tracking-tight">Nutrición AG</span>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
            <a href="#nosotros" className="hover:text-emerald-600 transition-colors">Quiénes somos</a>
            {testimonios.length > 0 && (
              <a href="#resultados" className="hover:text-emerald-600 transition-colors">Resultados</a>
            )}
            <a href="#planes" className="hover:text-emerald-600 transition-colors">Planes</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors px-3 py-2"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/40 to-white pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full mb-6">
            Nutrición personalizada · IA · Profesionales
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {data.hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {data.hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-sm"
            >
              Empezar gratis
            </Link>
            <a
              href="#nosotros"
              className="border border-gray-300 hover:border-emerald-400 text-gray-700 hover:text-emerald-600 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Conocer más
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitás en un solo lugar</h2>
            <p className="text-gray-500 mt-3">Herramientas diseñadas para ayudarte a alcanzar tus objetivos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.features.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section id="nosotros" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Nuestro equipo</h2>
            <p className="text-gray-500 mt-3">Profesionales de la salud comprometidos con tu bienestar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.equipo.map((m, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {m.nombre.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{m.nombre}</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-1">{m.matricula}</p>
                <p className="text-sm text-emerald-600 font-medium mb-4">{m.rol}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {m.especialidades.map((e, j) => (
                    <span key={j} className="bg-emerald-50 text-emerald-700 text-xs rounded-full px-3 py-1 font-medium">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      {testimonios.length > 0 && (
        <section id="resultados" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Resultados reales</h2>
              <p className="text-gray-500 mt-3">Personas que transformaron su vida con Nutrición AG</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonios.map((t) => (
                <div key={t.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Fotos */}
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-[4/5]">
                      <Image
                        fill
                        src={t.antesUrl}
                        alt={`${t.nombre} antes`}
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        Antes
                      </span>
                    </div>
                    <div className="relative aspect-[4/5]">
                      <Image
                        fill
                        src={t.despuesUrl}
                        alt={`${t.nombre} después`}
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        Después
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-gray-900">{t.nombre}</span>
                      {t.objetivo && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {t.objetivo}
                        </span>
                      )}
                    </div>

                    {(t.kilos !== null || t.meses !== null) && (
                      <p className="text-emerald-600 font-bold text-lg mb-2">
                        {t.kilos !== null && (
                          <span>{t.kilos < 0 ? `${t.kilos} kg` : `+${t.kilos} kg`}</span>
                        )}
                        {t.kilos !== null && t.meses !== null && (
                          <span className="text-gray-400 font-normal text-sm"> en </span>
                        )}
                        {t.meses !== null && (
                          <span>{t.meses} {t.meses === 1 ? "mes" : "meses"}</span>
                        )}
                      </p>
                    )}

                    {t.testimonio && (
                      <p className="text-sm text-gray-500 italic leading-relaxed">&ldquo;{t.testimonio}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Planes */}
      <section id="planes" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Elegí tu plan</h2>
            <p className="text-gray-500 mt-3">Comenzá gratis y escalá cuando lo necesites</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {data.planes.map((p, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 border-2 transition-all relative ${
                  p.destacado
                    ? "border-emerald-500 shadow-lg shadow-emerald-100 bg-white"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                {p.destacado && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Más elegido
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{p.nombre}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-xs text-gray-400 mb-1">{p.moneda}</span>
                  <span className="text-4xl font-extrabold text-gray-900">
                    {p.precio === "0" ? "0" : `$${p.precio}`}
                  </span>
                  {p.precio !== "0" && (
                    <span className="text-gray-400 text-sm mb-1">/{p.periodo}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login"
                  className={`block text-center font-semibold py-3 rounded-xl text-sm transition-colors ${
                    p.destacado
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border border-gray-300 hover:border-emerald-400 text-gray-700 hover:text-emerald-600"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        © 2026 Nutrición AG. Todos los derechos reservados.
      </footer>
    </div>
  )
}
