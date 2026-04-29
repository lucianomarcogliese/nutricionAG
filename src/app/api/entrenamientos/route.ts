import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { getPermisos } from "@/lib/permisos"

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const routines = await prisma.userRoutine.findMany({
      where: { profileId: profile.id },
      include: { _count: { select: { exercises: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ routines })
  } catch (error) {
    console.error("GET /api/entrenamientos error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener rutinas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const permisos = await getPermisos(session.user.id)
    if (permisos.maxRutinas !== -1) {
      const count = await prisma.userRoutine.count({ where: { profileId: profile.id } })
      if (count >= permisos.maxRutinas) {
        return NextResponse.json(
          { error: "LIMITE_RUTINAS", mensaje: "Tu plan no permite más rutinas" },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const name: string | undefined = typeof body.name === "string" ? body.name.trim() : undefined
    const description: string | undefined =
      typeof body.description === "string" ? body.description : undefined

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "El nombre no puede superar los 100 caracteres" },
        { status: 400 }
      )
    }

    const routine = await prisma.userRoutine.create({
      data: { profileId: profile.id, name, description },
    })

    return NextResponse.json({ routine }, { status: 201 })
  } catch (error) {
    console.error("POST /api/entrenamientos error completo:", error)
    console.error("message:", error instanceof Error ? error.message : String(error))
    console.error("stack:", error instanceof Error ? error.stack : "no stack")
    return NextResponse.json({ error: "Error al crear la rutina", detail: String(error) }, { status: 500 })
  }
}
