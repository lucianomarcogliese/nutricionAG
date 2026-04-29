import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { seedPlanes } from "@/lib/plan-seed"

// Llamar una vez para inicializar los nuevos permisos en DB:
//   POST /api/admin/seed-planes
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await seedPlanes()
    return NextResponse.json({ ok: true, message: "Planes actualizados correctamente" })
  } catch (error) {
    console.error("POST /api/admin/seed-planes error:", error)
    return NextResponse.json({ error: "Error al actualizar planes" }, { status: 500 })
  }
}
