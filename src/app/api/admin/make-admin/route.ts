// REMOVER EN PRODUCCIÓN — solo para setup inicial
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "ADMIN" },
  })

  return NextResponse.json({ success: true, role: "ADMIN" })
}
