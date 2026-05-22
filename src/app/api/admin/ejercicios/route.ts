import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { CategoriaEjercicio } from "@/generated/prisma/enums"

const VALID_CATEGORIAS: CategoriaEjercicio[] = [
  "PECHO", "ESPALDA", "PIERNAS", "HOMBROS", "BRAZOS", "ABDOMEN", "CARDIO", "CUERPO_COMPLETO",
]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || (role !== "ADMIN" && role !== "NUTRICIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const categoria = req.nextUrl.searchParams.get("categoria") as CategoriaEjercicio | null

    const ejercicios = await prisma.ejercicio.findMany({
      where: categoria && VALID_CATEGORIAS.includes(categoria) ? { categoria } : undefined,
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    })

    return NextResponse.json({ ejercicios })
  } catch (error) {
    console.error("GET /api/admin/ejercicios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener ejercicios" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, categoria, descripcion, videoUrl } = body

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    if (!VALID_CATEGORIAS.includes(categoria)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
    }

    const ejercicio = await prisma.ejercicio.create({
      data: {
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
      },
    })

    return NextResponse.json({ ejercicio }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/ejercicios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear ejercicio" }, { status: 500 })
  }
}
