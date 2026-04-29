import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import cloudinary from "@/lib/cloudinary"

function extractPublicId(url: string): string {
  // https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
  const match = url.match(/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match ? match[1] : ""
}

async function uploadToCloudinary(file: File): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "nutricion-ag/testimonios",
    transformation: [{ width: 400, height: 500, crop: "fill", gravity: "face" }],
  })
  return { url: result.secure_url }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await (prisma as any).testimonio.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const contentType = req.headers.get("content-type") ?? ""
    const isMultipart = contentType.includes("multipart/form-data")

    const updates: Record<string, unknown> = {}

    if (isMultipart) {
      const formData = await req.formData()

      const nombre = (formData.get("nombre") as string)?.trim()
      if (nombre) updates.nombre = nombre

      const testimonio = formData.get("testimonio")
      if (testimonio !== null) updates.testimonio = String(testimonio).trim() || null

      const objetivo = formData.get("objetivo")
      if (objetivo !== null) updates.objetivo = String(objetivo).trim() || null

      const kilosRaw = formData.get("kilos")
      if (kilosRaw !== null && kilosRaw !== "") updates.kilos = parseFloat(String(kilosRaw))

      const mesesRaw = formData.get("meses")
      if (mesesRaw !== null && mesesRaw !== "") updates.meses = parseInt(String(mesesRaw), 10)

      const ordenRaw = formData.get("orden")
      if (ordenRaw !== null && ordenRaw !== "") updates.orden = parseInt(String(ordenRaw), 10)

      const activoRaw = formData.get("activo")
      if (activoRaw !== null) updates.activo = activoRaw === "true"

      const antesFile = formData.get("antesImage") as File | null
      if (antesFile && antesFile.size > 0) {
        const { url } = await uploadToCloudinary(antesFile)
        updates.antesUrl = url
        const oldId = extractPublicId(existing.antesUrl)
        if (oldId) await cloudinary.uploader.destroy(oldId).catch(() => {})
      }

      const despuesFile = formData.get("despuesImage") as File | null
      if (despuesFile && despuesFile.size > 0) {
        const { url } = await uploadToCloudinary(despuesFile)
        updates.despuesUrl = url
        const oldId = extractPublicId(existing.despuesUrl)
        if (oldId) await cloudinary.uploader.destroy(oldId).catch(() => {})
      }
    } else {
      const body = await req.json()
      if (body.nombre !== undefined) updates.nombre = body.nombre
      if (body.testimonio !== undefined) updates.testimonio = body.testimonio
      if (body.objetivo !== undefined) updates.objetivo = body.objetivo
      if (body.kilos !== undefined) updates.kilos = body.kilos
      if (body.meses !== undefined) updates.meses = body.meses
      if (body.orden !== undefined) updates.orden = body.orden
      if (body.activo !== undefined) updates.activo = body.activo
    }

    const updated = await (prisma as any).testimonio.update({ where: { id }, data: updates })
    return NextResponse.json({ testimonio: updated })
  } catch (error) {
    console.error("PATCH /api/admin/testimonios/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar testimonio" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await (prisma as any).testimonio.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    // Eliminar imágenes de Cloudinary (best effort)
    const antesId = extractPublicId(existing.antesUrl)
    const despuesId = extractPublicId(existing.despuesUrl)
    await Promise.all([
      antesId ? cloudinary.uploader.destroy(antesId).catch(() => {}) : Promise.resolve(),
      despuesId ? cloudinary.uploader.destroy(despuesId).catch(() => {}) : Promise.resolve(),
    ])

    await (prisma as any).testimonio.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/testimonios/[id] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar testimonio" }, { status: 500 })
  }
}
