import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Sex, Goal, ActivityLevel } from "@/generated/prisma/enums"
import { logger } from "@/lib/logger"

const VALID_SEX: Sex[] = ["MALE", "FEMALE", "OTHER"]
const VALID_GOALS: Goal[] = ["LOSE_WEIGHT", "GAIN_MUSCLE", "MAINTAIN"]
const VALID_ACTIVITY: ActivityLevel[] = [
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "VERY_ACTIVE",
  "EXTREMELY_ACTIVE",
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    logger.info('body recibido:', JSON.stringify(body))
    const { fullName, age, weightKg, heightCm, sex, goal, activityLevel, dietaryRestrictions,
            tipoActividad, suplementosMedicacion, noGusta } = body

    if (!fullName || !age || !weightKg || !heightCm || !sex || !goal || !activityLevel) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const parsedAge = parseInt(age, 10)
    const parsedWeight = parseFloat(weightKg)
    const parsedHeight = parseFloat(heightCm)

    if (
      isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120 ||
      isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 400 ||
      isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 280 ||
      !VALID_SEX.includes(sex) ||
      !VALID_GOALS.includes(goal) ||
      !VALID_ACTIVITY.includes(activityLevel) ||
      !Array.isArray(dietaryRestrictions)
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        fullName,
        age: parsedAge,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        sex,
        goal,
        activityLevel,
        dietaryRestrictions,
        tipoActividad: tipoActividad ?? null,
        suplementosMedicacion: suplementosMedicacion ?? null,
        noGusta: noGusta ?? null,
        onboardingCompleted: true,
      },
      update: {
        fullName,
        age: parsedAge,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        sex,
        goal,
        activityLevel,
        dietaryRestrictions,
        tipoActividad: tipoActividad ?? null,
        suplementosMedicacion: suplementosMedicacion ?? null,
        noGusta: noGusta ?? null,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ success: true, profileId: profile.id })
  } catch (error) {
    logger.error('Error detallado:', JSON.stringify(error, null, 2))
    logger.error('Error message:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Datos inválidos', detail: String(error) }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fullName, age, weightKg, heightCm, sex, goal, activityLevel, dietaryRestrictions,
            tipoActividad, suplementosMedicacion, noGusta } = body

    if (!fullName || !age || !weightKg || !heightCm || !sex || !goal || !activityLevel) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const parsedAge = parseInt(age, 10)
    const parsedWeight = parseFloat(weightKg)
    const parsedHeight = parseFloat(heightCm)

    if (
      isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120 ||
      isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 400 ||
      isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 280 ||
      !VALID_SEX.includes(sex) ||
      !VALID_GOALS.includes(goal) ||
      !VALID_ACTIVITY.includes(activityLevel) ||
      !Array.isArray(dietaryRestrictions)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        fullName,
        age: parsedAge,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        sex,
        goal,
        activityLevel,
        dietaryRestrictions,
        tipoActividad: tipoActividad ?? null,
        suplementosMedicacion: suplementosMedicacion ?? null,
        noGusta: noGusta ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('PATCH /api/profile error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
  }
}
