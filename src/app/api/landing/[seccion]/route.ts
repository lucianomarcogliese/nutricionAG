import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { VALID_SECCIONES } from "@/lib/landing-seed"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ seccion: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { seccion } = await params
    if (!VALID_SECCIONES.includes(seccion)) {
      return NextResponse.json({ error: "Sección inválida" }, { status: 400 })
    }

    const contenido = await req.json()

    await prisma.landingContent.upsert({
      where: { seccion },
      create: { seccion, contenido },
      update: { contenido },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/landing/[seccion] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}
