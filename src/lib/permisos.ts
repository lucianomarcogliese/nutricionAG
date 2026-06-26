import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { Permisos } from "@/lib/plan-seed"

export type { Permisos }

export const DEFAULT_PERMISOS: Permisos = {
  maxPlanes: 1,
  maxRutinas: 1,
  usarIA: false,
  consultasProfesionales: false,
  verRecetas: false,
  verDescuentos: false,
  verChat: false,
  verAntropometria: false,
  verMensajesPrivados: false,
}

// Cacheada por request: si getPermisos y getProfileId se llaman con el mismo
// userId en el mismo render pass, la segunda call no dispara una query nueva.
const _fetchProfile = cache(async (userId: string) => {
  return prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      subscription: { select: { plan: true, estado: true, fechaVencimiento: true } },
    },
  })
})

// Cacheada entre requests: PlanConfig cambia solo cuando el admin guarda.
// Se invalida con revalidateTag('plan-config') en /api/admin/planes/[nombre].
const _fetchPlanConfig = unstable_cache(
  async (planNombre: string) => {
    return prisma.planConfig.findUnique({
      where: { nombre: planNombre },
      select: { permisos: true },
    })
  },
  ["plan-config"],
  { revalidate: 300, tags: ["plan-config"] }
)

export async function getPermisos(userId: string): Promise<Permisos> {
  const profile = await _fetchProfile(userId)

  const sub = profile?.subscription
  const isActive =
    sub &&
    sub.estado === "ACTIVA" &&
    !(sub.fechaVencimiento && sub.fechaVencimiento < new Date())

  const planNombre = isActive ? sub.plan : "GRATIS"

  const planConfig = await _fetchPlanConfig(planNombre)

  if (!planConfig) return DEFAULT_PERMISOS

  return { ...DEFAULT_PERMISOS, ...(planConfig.permisos as object) } as Permisos
}

export async function getProfileId(userId: string): Promise<string | null> {
  const profile = await _fetchProfile(userId)
  return profile?.id ?? null
}
