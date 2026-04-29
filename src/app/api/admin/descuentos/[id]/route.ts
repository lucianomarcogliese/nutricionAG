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

async function uploadImg(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buf.toString("base64")}`
  const res = await cloudinary.uploader.upload(dataUri, { folder: "nutricion-ag/descuentos" })
  return res.secure_url
}

type DescRow = { id: string; logoUrl: string | null; imagenUrl: string | null }

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
    const existing = await prisma.$queryRaw<DescRow[]>(
      Prisma.sql`SELECT id,"logoUrl","imagenUrl" FROM "Descuento" WHERE id=${id} LIMIT 1`
    )
    if (!existing[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    const rec = existing[0]

    const contentType = req.headers.get("content-type") ?? ""
    const setClauses: Prisma.Sql[] = []

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData()
      const str = (k: string) => { const v = (fd.get(k) as string)?.trim(); if (v !== undefined) setClauses.push(Prisma.sql`${Prisma.raw(`"${k}"`)}=${v || null}`) }

      const titulo = (fd.get("titulo") as string)?.trim(); if (titulo) setClauses.push(Prisma.sql`titulo=${titulo}`)
      const desc = (fd.get("descripcion") as string)?.trim(); if (desc !== undefined) setClauses.push(Prisma.sql`descripcion=${desc}`)
      const marca = (fd.get("marca") as string)?.trim(); if (marca) setClauses.push(Prisma.sql`marca=${marca}`)
      const cat = (fd.get("categoria") as string)?.trim(); if (cat) setClauses.push(Prisma.sql`categoria=${cat}`)
      const cod = fd.get("codigo"); if (cod !== null) setClauses.push(Prisma.sql`codigo=${String(cod).trim() || null}`)
      const lnk = fd.get("link"); if (lnk !== null) setClauses.push(Prisma.sql`link=${String(lnk).trim() || null}`)
      const pm = fd.get("planMinimo"); if (pm) setClauses.push(Prisma.sql`"planMinimo"=${String(pm)}`)
      const pct = fd.get("porcentaje"); if (pct !== null && pct !== "") setClauses.push(Prisma.sql`porcentaje=${parseInt(String(pct), 10)}`)
      const act = fd.get("activo"); if (act !== null) setClauses.push(Prisma.sql`activo=${act === "true"}`)
      const ord = fd.get("orden"); if (ord !== null && ord !== "") setClauses.push(Prisma.sql`orden=${parseInt(String(ord), 10)}`)
      const fv = fd.get("fechaVencimiento"); if (fv !== null) setClauses.push(Prisma.sql`"fechaVencimiento"=${fv !== "" ? new Date(String(fv)) : null}`)
      void str // suppress unused warning

      const logoFile = fd.get("logo") as File | null
      if (logoFile && logoFile.size > 0) {
        try {
          const url = await uploadImg(logoFile)
          setClauses.push(Prisma.sql`"logoUrl"=${url}`)
          if (rec.logoUrl) { const pid = extractPublicId(rec.logoUrl); if (pid) await cloudinary.uploader.destroy(pid).catch(() => {}) }
        } catch (e) { console.error("Logo upload error:", e) }
      }
      const imgFile = fd.get("imagen") as File | null
      if (imgFile && imgFile.size > 0) {
        try {
          const url = await uploadImg(imgFile)
          setClauses.push(Prisma.sql`"imagenUrl"=${url}`)
          if (rec.imagenUrl) { const pid = extractPublicId(rec.imagenUrl); if (pid) await cloudinary.uploader.destroy(pid).catch(() => {}) }
        } catch (e) { console.error("Imagen upload error:", e) }
      }
    } else {
      const body = await req.json()
      const map: Record<string, Prisma.Sql> = {
        titulo: Prisma.sql`titulo=${body.titulo}`,
        descripcion: Prisma.sql`descripcion=${body.descripcion}`,
        marca: Prisma.sql`marca=${body.marca}`,
        categoria: Prisma.sql`categoria=${body.categoria}`,
        codigo: Prisma.sql`codigo=${body.codigo}`,
        link: Prisma.sql`link=${body.link}`,
        planMinimo: Prisma.sql`"planMinimo"=${body.planMinimo}`,
        porcentaje: Prisma.sql`porcentaje=${body.porcentaje}`,
        activo: Prisma.sql`activo=${body.activo}`,
        orden: Prisma.sql`orden=${body.orden}`,
        fechaVencimiento: Prisma.sql`"fechaVencimiento"=${body.fechaVencimiento ? new Date(body.fechaVencimiento) : null}`,
      }
      for (const k of Object.keys(body)) {
        if (map[k]) setClauses.push(map[k])
      }
    }

    if (setClauses.length === 0) {
      const [cur] = await prisma.$queryRaw<unknown[]>(Prisma.sql`SELECT * FROM "Descuento" WHERE id=${id} LIMIT 1`)
      return NextResponse.json({ descuento: cur })
    }

    const [updated] = await prisma.$queryRaw<unknown[]>(
      Prisma.sql`UPDATE "Descuento" SET ${Prisma.join(setClauses, ", ")} WHERE id=${id} RETURNING *`
    )
    return NextResponse.json({ descuento: updated })
  } catch (error) {
    console.error("PATCH /api/admin/descuentos/[id] error:", error)
    return NextResponse.json({ error: "Error al actualizar descuento" }, { status: 500 })
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
    const rows = await prisma.$queryRaw<DescRow[]>(
      Prisma.sql`SELECT id,"logoUrl","imagenUrl" FROM "Descuento" WHERE id=${id} LIMIT 1`
    )
    if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const { logoUrl, imagenUrl } = rows[0]
    await Promise.all([
      logoUrl ? cloudinary.uploader.destroy(extractPublicId(logoUrl)).catch(() => {}) : Promise.resolve(),
      imagenUrl ? cloudinary.uploader.destroy(extractPublicId(imagenUrl)).catch(() => {}) : Promise.resolve(),
    ])

    await prisma.$executeRaw(Prisma.sql`DELETE FROM "Descuento" WHERE id=${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/admin/descuentos/[id] error:", error)
    return NextResponse.json({ error: "Error al eliminar descuento" }, { status: 500 })
  }
}
