import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

function newId() {
  return `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: recetaId } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    const existing = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "RecetaFavorita" WHERE "profileId"=${profile.id} AND "recetaId"=${recetaId} LIMIT 1`
    )

    if (existing.length > 0) {
      await prisma.$executeRaw(
        Prisma.sql`DELETE FROM "RecetaFavorita" WHERE id=${existing[0].id}`
      )
      return NextResponse.json({ isFavorito: false })
    }

    const id = newId()
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "RecetaFavorita" (id,"profileId","recetaId","createdAt") VALUES (${id},${profile.id},${recetaId},NOW())`
    )
    return NextResponse.json({ isFavorito: true })
  } catch (error) {
    console.error("POST favorito error:", error)
    return NextResponse.json({ error: "Error al actualizar favorito" }, { status: 500 })
  }
}
