import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

type WeightRow = { id: string; profileId: string; weightKg: number; fecha: Date; notas: string | null }

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) return NextResponse.json({ entries: [] })

    const entries = await prisma.$queryRaw<WeightRow[]>(
      Prisma.sql`SELECT id, "profileId", "weightKg", fecha, notas FROM "WeightEntry" WHERE "profileId" = ${profile.id} ORDER BY fecha ASC`
    )

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("GET /api/peso error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const { weightKg, fecha, notas } = await req.json() as {
      weightKg?: number | string
      fecha?: string
      notas?: string
    }

    const weight = Number(weightKg)
    if (!weightKg || isNaN(weight) || weight <= 0 || weight > 500) {
      return NextResponse.json({ error: "Peso inválido" }, { status: 400 })
    }

    const id = `cm${Math.random().toString(36).slice(2, 22)}`
    const fechaDate = fecha ? new Date(fecha) : new Date()
    const notasVal = notas?.trim() || null

    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "WeightEntry" (id, "profileId", "weightKg", fecha, notas) VALUES (${id}, ${profile.id}, ${weight}, ${fechaDate}, ${notasVal})`
    )

    const [entry] = await prisma.$queryRaw<WeightRow[]>(
      Prisma.sql`SELECT id, "profileId", "weightKg", fecha, notas FROM "WeightEntry" WHERE id = ${id}`
    )

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("POST /api/peso error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al guardar registro" }, { status: 500 })
  }
}
