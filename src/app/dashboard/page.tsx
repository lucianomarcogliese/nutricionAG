import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { LogoutButton } from '@/components/dashboard/LogoutButton'
import Link from 'next/link'
import { Scale, Target, Activity, Salad, Calendar } from 'lucide-react'

type WeightRow = { id: string; weightKg: number; fecha: Date }

const GOAL_LABELS: Record<string, string> = {
  LOSE_WEIGHT: 'Perder peso',
  GAIN_MUSCLE: 'Ganar músculo',
  MAINTAIN: 'Mantenerme',
}

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentario',
  LIGHTLY_ACTIVE: 'Poco activo',
  MODERATELY_ACTIVE: 'Moderadamente activo',
  VERY_ACTIVE: 'Muy activo',
  EXTREMELY_ACTIVE: 'Extremadamente activo',
}

const PLAN_BADGE: Record<string, string> = {
  GRATIS: 'bg-gray-100 text-gray-600',
  PRO: 'bg-emerald-100 text-emerald-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
}

const PLAN_LABEL: Record<string, string> = {
  GRATIS: 'Gratis',
  PRO: 'Pro',
  PREMIUM: 'Premium',
}

const TIPO_LABELS: Record<string, string> = {
  CONSULTA_NUTRICIONAL: 'Consulta nutricional',
  SEGUIMIENTO: 'Seguimiento',
  ANTROPOMETRIA: 'Antropometría',
  CONSULTA_DEPORTIVA: 'Consulta deportiva',
}

const ESTADO_CLS: Record<string, string> = {
  PENDIENTE:  'bg-amber-100 text-amber-700',
  CONFIRMADO: 'bg-emerald-100 text-emerald-700',
  CANCELADO:  'bg-red-100 text-red-600',
  COMPLETADO: 'bg-gray-100 text-gray-600',
}

async function UltimoRegistroPeso({ profileId }: { profileId: string }) {
  try {
    const rows = await prisma.$queryRaw<WeightRow[]>(
      Prisma.sql`SELECT id, "weightKg", fecha FROM "WeightEntry" WHERE "profileId" = ${profileId} ORDER BY fecha DESC LIMIT 2`
    )
    const entry = rows[0] ?? null
    const prev = rows[1] ?? null

    if (!entry) {
      return (
        <Link href="/dashboard/peso" className="block">
          <Scale className="w-5 h-5 text-gray-400 mb-2" />
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso</p>
          <p className="text-sm text-emerald-600 mt-1 hover:underline">Registrar →</p>
        </Link>
      )
    }

    const diff = prev ? +(entry.weightKg - prev.weightKg).toFixed(2) : null

    return (
      <Link href="/dashboard/peso" className="block">
        <Scale className="w-5 h-5 text-gray-400 mb-2" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso actual</p>
        <p className="text-lg font-bold text-gray-800 mt-1">
          {entry.weightKg} kg
          {diff !== null && (
            <span className={`ml-2 text-xs font-normal ${diff < 0 ? "text-emerald-600" : diff > 0 ? "text-amber-500" : "text-gray-400"}`}>
              {diff > 0 ? "+" : ""}{diff} kg
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Ver historial →</p>
      </Link>
    )
  } catch {
    return (
      <div>
        <Scale className="w-5 h-5 text-gray-300 mb-2" />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso</p>
        <p className="text-xs text-gray-400 mt-1">No disponible</p>
      </div>
    )
  }
}

async function ProximoTurno({ userId }: { userId: string }) {
  let turno = null
  try {
    const now = new Date()
    turno = await prisma.appointment.findFirst({
      where: {
        userId,
        fecha: { gte: now },
        estado: { not: 'CANCELADO' },
      },
      include: {
        nutricionista: { select: { nombre: true, color: true, matricula: true } },
      },
      orderBy: { fecha: 'asc' },
    })
  } catch {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Próximo turno</h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">No disponible en este momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Próximo turno</h2>
        <Link href="/dashboard/turnos" className="text-xs text-emerald-600 hover:underline font-medium">
          Ver todos →
        </Link>
      </div>

      {turno ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 flex-wrap">
          {turno.nutricionista && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: turno.nutricionista.color }}
            >
              {turno.nutricionista.nombre.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ESTADO_CLS[turno.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                {turno.estado.charAt(0) + turno.estado.slice(1).toLowerCase()}
              </span>
              <span className="text-xs text-gray-400">{TIPO_LABELS[turno.tipo] ?? turno.tipo}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {new Date(turno.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(turno.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {turno.duracion} min
              {turno.nutricionista && ` · ${turno.nutricionista.nombre}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No tenés turnos próximos.</p>
          <p className="text-gray-400 text-xs mt-1">Tu nutricionista los coordinará con vos.</p>
        </div>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      subscription: {
        select: { plan: true, estado: true, fechaVencimiento: true },
      },
    },
  })

  if (!profile || !profile.onboardingCompleted) {
    redirect('/onboarding')
  }

  const initial = profile.fullName?.charAt(0).toUpperCase() ?? '?'

  const sub = profile.subscription
  const planActual = sub?.estado === 'ACTIVA' ? (sub.plan ?? 'GRATIS') : 'GRATIS'
  const esGratis = planActual === 'GRATIS'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-emerald-600 font-bold text-lg">Nutrición AG</span>
          <div className="flex items-center gap-3">
            <Link
              href="/planes"
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors hover:opacity-80 ${PLAN_BADGE[planActual] ?? PLAN_BADGE.GRATIS}`}
            >
              {PLAN_LABEL[planActual] ?? planActual}
            </Link>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
              {initial}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{profile.fullName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {esGratis && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Estás usando el plan gratuito. Actualizá para acceder a planes ilimitados, IA y consultas profesionales.
            </p>
            <Link
              href="/planes"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Ver planes
            </Link>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {profile.fullName}</h1>
          <p className="text-sm text-gray-500 mt-1">Tu resumen de hoy</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <UltimoRegistroPeso profileId={profile.id} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <Target className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Objetivo</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {profile.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : '—'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <Activity className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actividad</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {profile.activityLevel ? ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel : '—'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <Salad className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan nutricional</p>
            <p className="text-sm text-gray-400 mt-1">Próximamente</p>
          </div>
        </div>

        <ProximoTurno userId={session.user.id} />
      </main>
    </div>
  )
}
