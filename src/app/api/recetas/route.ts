import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

type RecetaRow = {
  id: string; titulo: string; descripcion: string | null; imagenUrl: string | null
  ingredientes: unknown; pasos: unknown
  calorias: number | null; proteinas: number | null; carbos: number | null; grasas: number | null
  activo: boolean; orden: number
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const buscar = req.nextUrl.searchParams.get("buscar")?.trim()

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const recetas = buscar
      ? await prisma.$queryRaw<RecetaRow[]>(
          Prisma.sql`SELECT id,titulo,descripcion,"imagenUrl",ingredientes,pasos,calorias,proteinas,carbos,grasas,activo,orden FROM "Receta" WHERE activo=true AND titulo ILIKE ${"%" + buscar + "%"} ORDER BY orden ASC`
        )
      : await prisma.$queryRaw<RecetaRow[]>(
          Prisma.sql`SELECT id,titulo,descripcion,"imagenUrl",ingredientes,pasos,calorias,proteinas,carbos,grasas,activo,orden FROM "Receta" WHERE activo=true ORDER BY orden ASC`
        )

    const favSet = new Set<string>()
    if (profile) {
      const favs = await prisma.$queryRaw<{ recetaId: string }[]>(
        Prisma.sql`SELECT "recetaId" FROM "RecetaFavorita" WHERE "profileId"=${profile.id}`
      )
      favs.forEach((f) => favSet.add(f.recetaId))
    }

    const result = recetas.map((r) => ({ ...r, isFavorito: favSet.has(r.id) }))
    return NextResponse.json({ recetas: result })
  } catch (error) {
    console.error("GET /api/recetas error:", error)
    return NextResponse.json({ error: "Error al obtener recetas" }, { status: 500 })
  }
}
