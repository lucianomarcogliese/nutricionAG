import { prisma } from "@/lib/prisma"

export async function getProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })
  return profile?.id ?? null
}
