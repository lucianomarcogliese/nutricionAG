import { NextResponse } from "next/server"
import { getLandingContent } from "@/lib/landing-seed"

export async function GET() {
  try {
    const data = await getLandingContent()
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/landing error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener el contenido" }, { status: 500 })
  }
}
