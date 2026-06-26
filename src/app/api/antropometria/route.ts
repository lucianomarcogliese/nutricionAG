import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, age: true, sex: true },
    })
    if (!profile) {
      return NextResponse.json({ antropometrias: [], sex: null, age: null })
    }

    const antropometrias = await prisma.antropometria.findMany({
      where: { profileId: profile.id },
      orderBy: { fecha: "desc" },
      include: {
        nutricionista: { select: { id: true, nombre: true, color: true } },
      },
    })

    return NextResponse.json({ antropometrias, sex: profile.sex, age: profile.age })
  } catch (error) {
    logger.error("GET /api/antropometria error:", error)
    return NextResponse.json({ error: "Error al obtener antropometrías" }, { status: 500 })
  }
}
