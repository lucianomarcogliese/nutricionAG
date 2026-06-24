import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { calcularTodo } from "@/lib/antropometria-calculos"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "NUTRICIONISTA" && session.user.role !== "RECEPCIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ antropometrias: [] })
    }

    const antropometrias = await prisma.antropometria.findMany({
      where: { profileId: profile.id },
      orderBy: { fecha: "desc" },
      include: {
        nutricionista: { select: { id: true, nombre: true, color: true } },
      },
    })

    return NextResponse.json({ antropometrias })
  } catch (error) {
    logger.error("GET /api/admin/antropometria/[userId] error:", error)
    return NextResponse.json({ error: "Error al obtener antropometrías" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "NUTRICIONISTA" && session.user.role !== "RECEPCIONISTA")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true, age: true, sex: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const {
      fecha,
      pesoKg,
      tallaCm,
      tallaSentado,
      nutricionistaId,
      // Diámetros
      diametroBiacromial,
      diametroToraxTransverso,
      diametroToraxAnteroposterior,
      diametroBiiliocrestideo,
      diametroBiepicondileoHumeral,
      diametroBiepicondileoFemoral,
      diametroMunieca,
      // Perímetros
      perimetroCabeza,
      brazoRelajado,
      brazoFlexionado,
      perimetroAntebrazo,
      toraxMesoesternal,
      cinturaMinima,
      caderaMaxima,
      musloSuperior,
      musloMedial,
      pantorrillaMaxima,
      // Pliegues
      pliegueSubescapular,
      pliegueTriceps,
      pliegueSupraespinal,
      pliegueAbdominal,
      pliegueMusloMedial,
      plieguePantorrilla,
      notas,
    } = body

    if (!pesoKg || !tallaCm) {
      return NextResponse.json({ error: "pesoKg y tallaCm son requeridos" }, { status: 400 })
    }

    const calcInput = {
      pesoKg: Number(pesoKg),
      tallaCm: Number(tallaCm),
      edad: profile.age ?? 25,
      sexo: (profile.sex as "MALE" | "FEMALE") ?? "MALE",
      cinturaMinima: cinturaMinima ? Number(cinturaMinima) : undefined,
      caderaMaxima: caderaMaxima ? Number(caderaMaxima) : undefined,
      brazoFlexionado: brazoFlexionado ? Number(brazoFlexionado) : undefined,
      musloSuperior: musloSuperior ? Number(musloSuperior) : undefined,
      pantorrillaMaxima: pantorrillaMaxima ? Number(pantorrillaMaxima) : undefined,
      pliegueSubescapular: pliegueSubescapular ? Number(pliegueSubescapular) : undefined,
      pliegueTriceps: pliegueTriceps ? Number(pliegueTriceps) : undefined,
      pliegueSupraespinal: pliegueSupraespinal ? Number(pliegueSupraespinal) : undefined,
      pliegueAbdominal: pliegueAbdominal ? Number(pliegueAbdominal) : undefined,
      pliegueMusloMedial: pliegueMusloMedial ? Number(pliegueMusloMedial) : undefined,
      plieguePantorrilla: plieguePantorrilla ? Number(plieguePantorrilla) : undefined,
      diametroBiepicondileoFemoral: diametroBiepicondileoFemoral ? Number(diametroBiepicondileoFemoral) : undefined,
      diametroBiepicondileoHumeral: diametroBiepicondileoHumeral ? Number(diametroBiepicondileoHumeral) : undefined,
      diametroMunieca: diametroMunieca ? Number(diametroMunieca) : undefined,
    }

    const calculados = calcularTodo(calcInput)

    logger.info("[POST antropometria] profileId:", profile.id, "pesoKg:", pesoKg, "tallaCm:", tallaCm)
    logger.info("[POST antropometria] calculados:", JSON.stringify(calculados))

    const f = (v: unknown) => (v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null)

    const antropometria = await prisma.antropometria.create({
      data: {
        profileId: profile.id,
        nutricionistaId: nutricionistaId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        pesoKg: parseFloat(String(pesoKg)),
        tallaCm: parseFloat(String(tallaCm)),
        tallaSentado: f(tallaSentado),
        // Diámetros
        diametroBiacromial: f(diametroBiacromial),
        diametroToraxTransverso: f(diametroToraxTransverso),
        diametroToraxAnteroposterior: f(diametroToraxAnteroposterior),
        diametroBiiliocrestideo: f(diametroBiiliocrestideo),
        diametroBiepicondileoHumeral: f(diametroBiepicondileoHumeral),
        diametroBiepicondileoFemoral: f(diametroBiepicondileoFemoral),
        diametroMunieca: f(diametroMunieca),
        // Perímetros
        perimetroCabeza: f(perimetroCabeza),
        brazoRelajado: f(brazoRelajado),
        brazoFlexionado: f(brazoFlexionado),
        perimetroAntebrazo: f(perimetroAntebrazo),
        toraxMesoesternal: f(toraxMesoesternal),
        cinturaMinima: f(cinturaMinima),
        caderaMaxima: f(caderaMaxima),
        musloSuperior: f(musloSuperior),
        musloMedial: f(musloMedial),
        pantorrillaMaxima: f(pantorrillaMaxima),
        // Pliegues
        pliegueSubescapular: f(pliegueSubescapular),
        pliegueTriceps: f(pliegueTriceps),
        pliegueSupraespinal: f(pliegueSupraespinal),
        pliegueAbdominal: f(pliegueAbdominal),
        pliegueMusloMedial: f(pliegueMusloMedial),
        plieguePantorrilla: f(plieguePantorrilla),
        // Resultados calculados
        imc: calculados.imc,
        icc: calculados.icc ?? null,
        porcentajeGrasa: calculados.porcentajeGrasa ?? null,
        masaGrasaKg: calculados.masaGrasaKg ?? null,
        masaMagraKg: calculados.masaMagraKg ?? null,
        masaOseaKg: calculados.masaOseaKg ?? null,
        masaMuscularKg: calculados.masaMuscularKg ?? null,
        endomorfismo: calculados.endomorfismo ?? null,
        mesomorfismo: calculados.mesomorfismo ?? null,
        ectomorfismo: calculados.ectomorfismo ?? null,
        notas: notas || null,
      },
      include: {
        nutricionista: { select: { id: true, nombre: true, color: true } },
      },
    })

    return NextResponse.json({ antropometria }, { status: 201 })
  } catch (error) {
    logger.error("[POST antropometria] message:", error instanceof Error ? error.message : String(error))
    logger.error("[POST antropometria] stack:", error instanceof Error ? error.stack : "")
    return NextResponse.json(
      { error: "Error al guardar antropometría", detail: String(error) },
      { status: 500 }
    )
  }
}
