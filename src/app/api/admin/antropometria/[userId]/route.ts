import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { calcularTodo } from "@/lib/antropometria-calculos"

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
    console.error("GET /api/admin/antropometria/[userId] error:", error)
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
      nutricionistaId,
      cinturaCm,
      caderaCm,
      brazoCm,
      musloDerechoCm,
      pantorrillaDerechaCm,
      pliegueSubescapular,
      pliegueTriceps,
      pliegueSuprailiaco,
      pliegueAbdominal,
      pliegueMusloAnterior,
      plieguePantorrilla,
      pliegueAxilarMedio,
      plieguePectoral,
      diametroBiepicondileoFemoral,
      diametroBiepicondileoHumeral,
      diametroMunieca,
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
      cinturaCm: cinturaCm ? Number(cinturaCm) : undefined,
      caderaCm: caderaCm ? Number(caderaCm) : undefined,
      brazoCm: brazoCm ? Number(brazoCm) : undefined,
      musloDerechoCm: musloDerechoCm ? Number(musloDerechoCm) : undefined,
      pantorrillaDerechaCm: pantorrillaDerechaCm ? Number(pantorrillaDerechaCm) : undefined,
      pliegueSubescapular: pliegueSubescapular ? Number(pliegueSubescapular) : undefined,
      pliegueTriceps: pliegueTriceps ? Number(pliegueTriceps) : undefined,
      pliegueSuprailiaco: pliegueSuprailiaco ? Number(pliegueSuprailiaco) : undefined,
      pliegueAbdominal: pliegueAbdominal ? Number(pliegueAbdominal) : undefined,
      pliegueMusloAnterior: pliegueMusloAnterior ? Number(pliegueMusloAnterior) : undefined,
      plieguePantorrilla: plieguePantorrilla ? Number(plieguePantorrilla) : undefined,
      diametroBiepicondileoFemoral: diametroBiepicondileoFemoral ? Number(diametroBiepicondileoFemoral) : undefined,
      diametroBiepicondileoHumeral: diametroBiepicondileoHumeral ? Number(diametroBiepicondileoHumeral) : undefined,
      diametroMunieca: diametroMunieca ? Number(diametroMunieca) : undefined,
    }

    const calculados = calcularTodo(calcInput)

    console.log("[POST antropometria] profileId:", profile.id, "pesoKg:", pesoKg, "tallaCm:", tallaCm)
    console.log("[POST antropometria] calculados:", JSON.stringify(calculados))

    // Verificación: prisma.antropometria debe coincidir con el modelo 'Antropometria' del schema
    const f = (v: unknown) => (v !== undefined && v !== "" && v !== null ? parseFloat(String(v)) : null)

    const antropometria = await prisma.antropometria.create({
      data: {
        profileId: profile.id,
        nutricionistaId: nutricionistaId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        pesoKg: parseFloat(String(pesoKg)),
        tallaCm: parseFloat(String(tallaCm)),
        cinturaCm: f(cinturaCm),
        caderaCm: f(caderaCm),
        brazoCm: f(brazoCm),
        musloDerechoCm: f(musloDerechoCm),
        pantorrillaDerechaCm: f(pantorrillaDerechaCm),
        pliegueSubescapular: f(pliegueSubescapular),
        pliegueTriceps: f(pliegueTriceps),
        pliegueSuprailiaco: f(pliegueSuprailiaco),
        pliegueAbdominal: f(pliegueAbdominal),
        pliegueMusloAnterior: f(pliegueMusloAnterior),
        plieguePantorrilla: f(plieguePantorrilla),
        pliegueAxilarMedio: f(pliegueAxilarMedio),
        plieguePectoral: f(plieguePectoral),
        diametroBiepicondileoFemoral: f(diametroBiepicondileoFemoral),
        diametroBiepicondileoHumeral: f(diametroBiepicondileoHumeral),
        diametroMunieca: f(diametroMunieca),
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
    console.error("[POST antropometria] message:", error instanceof Error ? error.message : String(error))
    console.error("[POST antropometria] stack:", error instanceof Error ? error.stack : "")
    return NextResponse.json(
      { error: "Error al guardar antropometría", detail: String(error) },
      { status: 500 }
    )
  }
}
