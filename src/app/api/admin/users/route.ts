import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "RECEPCIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roleFilter = new URL(req.url).searchParams.get("role")
    const validRole = roleFilter && (Object.values(Role) as string[]).includes(roleFilter)
      ? (roleFilter as Role)
      : undefined

    const users = await prisma.user.findMany({
      where: validRole ? { role: validRole } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            age: true,
            weightKg: true,
            heightCm: true,
            sex: true,
            goal: true,
            activityLevel: true,
            onboardingCompleted: true,
            dietaryRestrictions: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    logger.error("GET /api/admin/users error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
