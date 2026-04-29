import { prisma } from "@/lib/prisma"

export interface Permisos {
  maxPlanes: number
  maxRutinas: number
  usarIA: boolean
  consultasProfesionales: boolean
  verRecetas: boolean
  verDescuentos: boolean
  verChat: boolean
  verAntropometria: boolean
  verMensajesPrivados: boolean
  [key: string]: unknown
}

const PLANES: { nombre: string; displayName: string; precioARS: number; permisos: Permisos }[] = [
  {
    nombre: "GRATIS",
    displayName: "Plan Gratis",
    precioARS: 0,
    permisos: {
      maxPlanes: 1,
      maxRutinas: 1,
      usarIA: false,
      consultasProfesionales: false,
      verRecetas: false,
      verDescuentos: false,
      verChat: false,
      verAntropometria: false,
      verMensajesPrivados: false,
    },
  },
  {
    nombre: "PRO",
    displayName: "Plan Pro",
    precioARS: 9999,
    permisos: {
      maxPlanes: -1,
      maxRutinas: -1,
      usarIA: true,
      consultasProfesionales: false,
      verRecetas: true,
      verDescuentos: true,
      verChat: true,
      verAntropometria: false,
      verMensajesPrivados: true,
    },
  },
  {
    nombre: "PREMIUM",
    displayName: "Plan Premium",
    precioARS: 19999,
    permisos: {
      maxPlanes: -1,
      maxRutinas: -1,
      usarIA: true,
      consultasProfesionales: true,
      verRecetas: true,
      verDescuentos: true,
      verChat: true,
      verAntropometria: true,
      verMensajesPrivados: true,
    },
  },
]

export async function seedPlanes() {
  for (const p of PLANES) {
    await prisma.planConfig.upsert({
      where: { nombre: p.nombre },
      update: { displayName: p.displayName, precioARS: p.precioARS, permisos: p.permisos as object },
      create: { nombre: p.nombre, displayName: p.displayName, precioARS: p.precioARS, permisos: p.permisos as object, activo: true },
    })
  }
}

export async function ensurePlanSeed() {
  const count = await prisma.planConfig.count()
  if (count === 0) await seedPlanes()
}
