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
  if (!sub || sub.estado !== "ACTIVA") return DEFAULT_PERMISOS
  if (sub.fechaVencimiento && sub.fechaVencimiento < new Date()) return DEFAULT_PERMISOS

  const planConfig = await prisma.planConfig.findUnique({
    where: { nombre: sub.plan },
    select: { permisos: true },
  })

  if (!planConfig) return DEFAULT_PERMISOS

  return { ...DEFAULT_PERMISOS, ...(planConfig.permisos as object) } as Permisos
}
