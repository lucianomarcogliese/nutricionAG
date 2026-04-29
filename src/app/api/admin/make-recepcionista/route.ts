// REMOVER EN PRODUCCIÓN — ruta de conveniencia para asignar rol RECEPCIONISTA
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Falta email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  await prisma.user.update({ where: { email }, data: { role: "RECEPCIONISTA" as any } })
  return NextResponse.json({ ok: true, email, role: "RECEPCIONISTA" })
}
