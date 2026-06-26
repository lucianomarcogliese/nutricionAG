import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { Permisos } from "@/lib/plan-seed"
import { logger } from "@/lib/logger"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ nombre: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { nombre } = await params
    const body = await req.json() as {
      displayName?: string
      precioARS?: number
      activo?: boolean
      permisos?: Partial<Permisos>
    }

    const existing = await prisma.planConfig.findUnique({ where: { nombre } })
    if (!existing) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    if (body.permisos) {
      const { maxPlanes, maxRutinas } = body.permisos
      if (maxPlanes !== undefined && maxPlanes !== -1 && (maxPlanes < 1 || !Number.isInteger(maxPlanes))) {
        return NextResponse.json({ error: "maxPlanes debe ser -1 o un entero positivo" }, { status: 400 })
      }
      if (maxRutinas !== undefined && maxRutinas !== -1 && (maxRutinas < 1 || !Number.isInteger(maxRutinas))) {
        return NextResponse.json({ error: "maxRutinas debe ser -1 o un entero positivo" }, { status: 400 })
      }
    }

    const updateData: {
      displayName?: string
      precioARS?: number
      activo?: boolean
      permisos?: object
    } = {}

    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.precioARS !== undefined) updateData.precioARS = body.precioARS
    if (body.activo !== undefined) updateData.activo = body.activo
    if (body.permisos !== undefined) {
      updateData.permisos = { ...(existing.permisos as object), ...body.permisos }
    }

    const plan = await prisma.planConfig.update({
      where: { nombre },
      data: updateData,
    })

    revalidateTag("plan-config", { expire: 0 })

    return NextResponse.json({ plan })
  } catch (error) {
    logger.error("PATCH /api/admin/planes/[nombre] error:", error)
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}
