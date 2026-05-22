import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import cloudinary from "@/lib/cloudinary"

function newId() {
  return `cm${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

async function uploadImg(file: File, folder = "nutricion-ag/descuentos"): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buf.toString("base64")}`
  const res = await cloudinary.uploader.upload(dataUri, { folder })
  return res.secure_url
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

    const [descuentos, [{ total }]] = await Promise.all([
      prisma.$queryRaw<unknown[]>(
        Prisma.sql`SELECT * FROM "Descuento" ORDER BY orden ASC LIMIT ${limit} OFFSET ${offset}`
      ),
      prisma.$queryRaw<[{ total: number }]>(
        Prisma.sql`SELECT COUNT(*)::int AS total FROM "Descuento"`
      ),
    ])

    return NextResponse.json({ descuentos, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("GET /api/admin/descuentos error:", error)
    return NextResponse.json({ error: "Error al obtener descuentos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fd = await req.formData()
    const titulo = (fd.get("titulo") as string)?.trim()
    const descripcion = (fd.get("descripcion") as string)?.trim()
    const marca = (fd.get("marca") as string)?.trim()
    const categoria = (fd.get("categoria") as string)?.trim()

    if (!titulo || !descripcion || !marca || !categoria) {
      return NextResponse.json({ error: "titulo, descripcion, marca y categoria son requeridos" }, { status: 400 })
    }

    let logoUrl: string | null = null
    let imagenUrl: string | null = null

    const logoFile = fd.get("logo") as File | null
    if (logoFile && logoFile.size > 0) {
      try { logoUrl = await uploadImg(logoFile) } catch (e) { console.error("Logo upload error:", e) }
    }
    const imgFile = fd.get("imagen") as File | null
    if (imgFile && imgFile.size > 0) {
      try { imagenUrl = await uploadImg(imgFile) } catch (e) { console.error("Imagen upload error:", e) }
    }

    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "Descuento"`
    )

    const id = newId()
    const codigo = (fd.get("codigo") as string)?.trim() || null
    const link = (fd.get("link") as string)?.trim() || null
    const planMinimo = (fd.get("planMinimo") as string) || "PRO"
    const pctRaw = fd.get("porcentaje"); const porcentaje = pctRaw && pctRaw !== "" ? parseInt(String(pctRaw), 10) : null
    const fvRaw = fd.get("fechaVencimiento"); const fechaVencimiento = fvRaw && fvRaw !== "" ? new Date(String(fvRaw)) : null
    const orden = Number(count)

    const [descuento] = await prisma.$queryRaw<unknown[]>(
      Prisma.sql`
        INSERT INTO "Descuento" (id,titulo,descripcion,marca,"logoUrl","imagenUrl",codigo,porcentaje,link,categoria,"planMinimo",activo,"fechaVencimiento",orden,"createdAt")
        VALUES (${id},${titulo},${descripcion},${marca},${logoUrl},${imagenUrl},${codigo},${porcentaje},${link},${categoria},${planMinimo},true,${fechaVencimiento},${orden},NOW())
        RETURNING *
      `
    )

    return NextResponse.json({ descuento }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/descuentos error:", error)
    return NextResponse.json({
      error: "Error al crear descuento",
      detalle: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
