import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import cloudinary from "@/lib/cloudinary"

function newId() {
  return `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

async function uploadImagen(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "nutricion-ag/recetas",
    transformation: [{ width: 800, height: 600, crop: "fill" }],
  })
  return result.secure_url
}

type RecetaRow = {
  id: string; titulo: string; descripcion: string | null; imagenUrl: string | null
  ingredientes: unknown; pasos: unknown
  calorias: number | null; proteinas: number | null; carbos: number | null; grasas: number | null
  activo: boolean; orden: number; createdAt: Date; updatedAt: Date
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50))
    const offset = (page - 1) * limit

    const [recetas, [{ total }]] = await Promise.all([
      prisma.$queryRaw<RecetaRow[]>(
        Prisma.sql`SELECT * FROM "Receta" ORDER BY orden ASC LIMIT ${limit} OFFSET ${offset}`
      ),
      prisma.$queryRaw<[{ total: number }]>(
        Prisma.sql`SELECT COUNT(*)::int AS total FROM "Receta"`
      ),
    ])

    return NextResponse.json({ recetas, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("GET /api/admin/recetas error:", error)
    return NextResponse.json({ error: "Error al obtener recetas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const titulo = (formData.get("titulo") as string)?.trim()
    if (!titulo) return NextResponse.json({ error: "El título es requerido" }, { status: 400 })

    let ingredientes: unknown[] = []
    let pasos: unknown[] = []
    try { ingredientes = JSON.parse((formData.get("ingredientes") as string) || "[]") } catch {}
    try { pasos = JSON.parse((formData.get("pasos") as string) || "[]") } catch {}

    let imagenUrl: string | null = null
    const imagenFile = formData.get("imagen") as File | null
    if (imagenFile && imagenFile.size > 0) {
      try { imagenUrl = await uploadImagen(imagenFile) } catch (e) {
        console.error("Cloudinary upload error:", e)
      }
    }

    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "Receta"`
    )

    const descripcion = (formData.get("descripcion") as string)?.trim() || null
    const cal = formData.get("calorias"); const prot = formData.get("proteinas")
    const carb = formData.get("carbos"); const gras = formData.get("grasas")
    const calorias = cal && cal !== "" ? parseInt(String(cal), 10) : null
    const proteinas = prot && prot !== "" ? parseFloat(String(prot)) : null
    const carbos = carb && carb !== "" ? parseFloat(String(carb)) : null
    const grasas = gras && gras !== "" ? parseFloat(String(gras)) : null
    const orden = Number(count)
    const id = newId()

    const [receta] = await prisma.$queryRaw<RecetaRow[]>(
      Prisma.sql`
        INSERT INTO "Receta" (id,titulo,descripcion,"imagenUrl",ingredientes,pasos,calorias,proteinas,carbos,grasas,activo,orden,"createdAt","updatedAt")
        VALUES (
          ${id}, ${titulo}, ${descripcion}, ${imagenUrl},
          ${JSON.stringify(ingredientes)}::jsonb, ${JSON.stringify(pasos)}::jsonb,
          ${calorias}, ${proteinas}, ${carbos}, ${grasas},
          true, ${orden}, NOW(), NOW()
        )
        RETURNING *
      `
    )

    return NextResponse.json({ receta }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/recetas error:", error)
    return NextResponse.json({
      error: "Error al crear receta",
      detalle: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
