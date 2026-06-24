import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get("socket_id")
    const channelName = params.get("channel_name")

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 })
    }

    // Only authorize private-privado-{conversacionId} channels
    if (!channelName.startsWith("private-privado-")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const conversacionId = channelName.replace("private-privado-", "")

    const conv = await prisma.conversacion.findUnique({
      where: { id: conversacionId },
      select: { profileId: true, nutricionistaId: true },
    })

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const role = session.user.role

    if (role === "ADMIN") {
      // Admins can access any conversation
    } else if (role === "NUTRICIONISTA") {
      // Nutricionistas only access their own conversations
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { nutricionistaId: true },
      })
      if (!user?.nutricionistaId || user.nutricionistaId !== conv.nutricionistaId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      // Regular users only access their own profile's conversations
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!profile || profile.id !== conv.profileId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("POST /api/pusher/auth error:", error)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }
}
