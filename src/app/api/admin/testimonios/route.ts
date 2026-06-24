import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import cloudinary from "@/lib/cloudinary"
import { logger } from "@/lib/logger"

async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "nutricion-ag/testimonios",
    transformation: [{ width: 400, height: 500, crop: "fill", gravity: "face" }],
  })

  return { url: result.secure_url, publicId: result.public_id }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const testimonios = await prisma.testimonio.findMany({
      orderBy: { orden: "asc" },
    })
    return NextResponse.json({ testimonios })
  } catch (error) {
    logger.error("GET /api/admin/testimonios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener testimonios" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()

    const antesFile = formData.get("antesImage") as File | null
    const despuesFile = formData.get("despuesImage") as File | null
    const nombre = (formData.get("nombre") as string)?.trim()

    if (!antesFile || !despuesFile || !nombre) {
      return NextResponse.json(
        { error: "nombre, antesImage y despuesImage son requeridos" },
        { status: 400 }
      )
    }

    const [antes, despues] = await Promise.all([
      uploadToCloudinary(antesFile),
      uploadToCloudinary(despuesFile),
    ])

    const count = await prisma.testimonio.count()

    const kilosRaw = formData.get("kilos")
    const mesesRaw = formData.get("meses")

    const testimonio = await prisma.testimonio.create({
      data: {
        nombre,
        antesUrl: antes.url,
        despuesUrl: despues.url,
        kilos: kilosRaw !== null && kilosRaw !== "" ? parseFloat(String(kilosRaw)) : null,
        meses: mesesRaw !== null && mesesRaw !== "" ? parseInt(String(mesesRaw), 10) : null,
        testimonio: (formData.get("testimonio") as string)?.trim() || null,
        objetivo: (formData.get("objetivo") as string)?.trim() || null,
        orden: count,
      },
    })

    return NextResponse.json({ testimonio }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/admin/testimonios error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear testimonio" }, { status: 500 })
  }
}
