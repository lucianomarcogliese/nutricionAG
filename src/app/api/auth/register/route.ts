import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/schemas/registerSchema"
import { sendEmail } from "@/lib/email"
import { bienvenidaHtml, bienvenidaSubject } from "@/emails/bienvenida"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, email, password } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email ya registrado", details: { email: ["Este email ya tiene una cuenta"] } },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)
    const user = await prisma.user.create({ data: { name, email, passwordHash } })
    await prisma.profile.create({ data: { userId: user.id, fullName: name } })

    try {
      await sendEmail(email, bienvenidaSubject, bienvenidaHtml({ nombre: name }))
    } catch (emailError) {
      console.error("POST /api/auth/register: error enviando email de bienvenida:", emailError instanceof Error ? emailError.message : emailError)
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("POST /api/auth/register error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 })
  }
}
