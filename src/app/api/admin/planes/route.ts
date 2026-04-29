import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const planes = await prisma.planConfig.findMany({
      orderBy: { precioARS: "asc" },
    })

    return NextResponse.json({ planes })
  } catch (error) {
    console.error("GET /api/admin/planes error:", error)
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
  }
}
