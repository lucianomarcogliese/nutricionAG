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

export async function getPermisos(userId: string): Promise<Permisos> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      subscription: {
        select: { plan: true, estado: true, fechaVencimiento: true },
      },
    },
  })

  const sub = profile?.subscription
  const isActive =
    sub &&
    sub.estado === "ACTIVA" &&
    !(sub.fechaVencimiento && sub.fechaVencimiento < new Date())

  // Users with no subscription or expired → fall back to GRATIS plan config
  const planNombre = isActive ? sub.plan : "GRATIS"

  const planConfig = await prisma.planConfig.findUnique({
    where: { nombre: planNombre },
    select: { permisos: true },
  })

  if (!planConfig) return DEFAULT_PERMISOS

  return { ...DEFAULT_PERMISOS, ...(planConfig.permisos as object) } as Permisos
}
