import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import cloudinary from "@/lib/cloudinary"

function extractPublicId(url: string): string {
  const match = url.match(/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match ? match[1] : ""
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
  activo: boolean; orden: number
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
    const existing = await prisma.$queryRaw<RecetaRow[]>(
      Prisma.sql`SELECT * FROM "Receta" WHERE id=${id} LIMIT 1`
    )
    if (!existing[0]) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    const rec = existing[0]

    const contentType = req.headers.get("content-type") ?? ""
    const setClauses: Prisma.Sql[] = []

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData()

      const titulo = (fd.get("titulo") as string)?.trim()
      if (titulo) setClauses.push(Prisma.sql`titulo=${titulo}`)

      const desc = fd.get("descripcion")
      if (desc !== null) setClauses.push(Prisma.sql`descripcion=${String(desc).trim() || null}`)

      const ingRaw = fd.get("ingredientes")
      if (ingRaw) {
        try { setClauses.push(Prisma.sql`ingredientes=${JSON.stringify(JSON.parse(String(ingRaw)))}::jsonb`) } catch {}
      }

      const pasosRaw = fd.get("pasos")
      if (pasosRaw) {
        try { setClauses.push(Prisma.sql`pasos=${JSON.stringify(JSON.parse(String(pasosRaw)))}::jsonb`) } catch {}
      }

      const cal = fd.get("calorias"); if (cal !== null && cal !== "") setClauses.push(Prisma.sql`calorias=${parseInt(String(cal), 10)}`)
      const prot = fd.get("proteinas"); if (prot !== null && prot !== "") setClauses.push(Prisma.sql`proteinas=${parseFloat(String(prot))}`)
      const carb = fd.get("carbos"); if (carb !== null && carb !== "") setClauses.push(Prisma.sql`carbos=${parseFloat(String(carb))}`)
      const gras = fd.get("grasas"); if (gras !== null && gras !== "") setClauses.push(Prisma.sql`grasas=${parseFloat(String(gras))}`)
      const ord = fd.get("orden"); if (ord !== null && ord !== "") setClauses.push(Prisma.sql`orden=${parseInt(String(ord), 10)}`)
      const act = fd.get("activo"); if (act !== null) setClauses.push(Prisma.sql`activo=${act === "true"}`)

      const imgFile = fd.get("imagen") as File | null
      if (imgFile && imgFile.size > 0) {
        try {
          const url = await uploadImagen(imgFile)
          setClauses.push(Prisma.sql`"imagenUrl"=${url}`)
          if (rec.imagenUrl) {
            const pid = extractPublicId(rec.imagenUrl)
            if (pid) await cloudinary.uploader.destroy(pid).catch(() => {})
          }
        } catch (e) { console.error("Cloudinary upload error:", e) }
      }
    } else {
      const body = await req.json()
      if (body.titulo !== undefined) setClauses.push(Prisma.sql`titulo=${body.titulo}`)
      if (body.descripcion !== undefined) setClauses.push(Prisma.sql`descripcion=${body.descripcion}`)
      if (body.ingredientes !== undefined) setClauses.push(Prisma.sql`ingredientes=${JSON.stringify(body.ingredientes)}::jsonb`)
      if (body.pasos !== undefined) setClauses.push(Prisma.sql`pasos=${JSON.stringify(body.pasos)}::jsonb`)
      if (body.calorias !== undefined) setClauses.push(Prisma.sql`calorias=${body.calorias}`)
      if (body.proteinas !== undefined) setClauses.push(Prisma.sql`proteinas=${body.proteinas}`)
      if (body.carbos !== undefined) setClauses.push(Prisma.sql`carbos=${body.carbos}`)
      if (body.grasas !== undefined) setClauses.push(Prisma.sql`grasas=${body.grasas}`)
      if (body.orden !== undefined) setClauses.push(Prisma.sql`orden=${body.orden}`)
      if (body.activo !== undefined) setClauses.push(Prisma.sql`activo=${body.activo}`)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ receta: rec })
    }

    setClauses.push(Prisma.sql`"updatedAt"=NOW()`)

    const setFragment = Prisma.join(setClauses, ", ")
    const [updated] = await prisma.$queryRaw<RecetaRow[]>(
      Prisma.sql`UPDATE "Receta" SET ${setFragment} WHERE id=${id} RETURNING *`
    )

    return NextResponse.json({ receta: updated })
  } catch (error) {
    console.error("PATCH /api/admin/recetas/[id] error:", error)
    return NextResponse.json({ error: "Error al actualizar receta" }, { status: 500 })
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
    const rows = await prisma.$queryRaw<RecetaRow[]>(
      Prisma.sql`SELECT id,"imagenUrl" FROM "Receta" WHERE id=${id} LIMIT 1`
    )
    if (!rows[0]) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    if (rows[0].imagenUrl) {
      const pid = extractPublicId(rows[0].imagenUrl as string)
      if (pid) await cloudinary.uploader.destroy(pid).catch(() => {})
    }

    await prisma.$executeRaw(Prisma.sql`DELETE FROM "Receta" WHERE id=${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/recetas/[id] error:", error)
    return NextResponse.json({ error: "Error al eliminar receta" }, { status: 500 })
  }
}
