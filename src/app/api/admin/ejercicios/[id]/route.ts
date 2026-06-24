import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { CategoriaEjercicio } from "@/generated/prisma/enums"
import { logger } from "@/lib/logger"

const VALID_CATEGORIAS: CategoriaEjercicio[] = [
  "PECHO", "ESPALDA", "PIERNAS", "HOMBROS", "BRAZOS", "ABDOMEN", "CARDIO", "CUERPO_COMPLETO",
]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { nombre, categoria, descripcion, videoUrl } = body

    const data: Record<string, unknown> = {}
    if (nombre !== undefined) data.nombre = nombre.trim()
    if (categoria !== undefined) {
      if (!VALID_CATEGORIAS.includes(categoria)) {
        return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
      }
      data.categoria = categoria
    }
    if (descripcion !== undefined) data.descripcion = descripcion?.trim() || null
    if (videoUrl !== undefined) data.videoUrl = videoUrl?.trim() || null

    const ejercicio = await prisma.ejercicio.update({ where: { id }, data })
    return NextResponse.json({ ejercicio })
  } catch (error) {
    logger.error("PATCH /api/admin/ejercicios/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar ejercicio" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await prisma.ejercicio.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/admin/ejercicios/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar ejercicio" }, { status: 500 })
  }
}
