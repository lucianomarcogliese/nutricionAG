import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { ensurePlanSeed } from '@/lib/plan-seed'
import { PlanesClient } from './PlanesClient'

export default async function PlanesPage() {
  const session = await getServerSession(authOptions)

  await ensurePlanSeed()

  const planes = await prisma.planConfig.findMany({
    where: { activo: true },
    orderBy: { precioARS: 'asc' },
  })

  let subscription = null
  if (session?.user?.id) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        subscription: {
          select: { plan: true, estado: true, fechaVencimiento: true },
        },
      },
    })
    subscription = profile?.subscription ?? null
  }

  type Permisos = { maxPlanes: number; maxRutinas: number; usarIA: boolean; consultasProfesionales: boolean }

  return (
    <PlanesClient
      planes={planes.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        displayName: p.displayName,
        precioARS: p.precioARS,
        permisos: p.permisos as unknown as Permisos,
      }))}
      subscription={subscription ? {
        plan: subscription.plan,
        estado: subscription.estado,
        fechaVencimiento: subscription.fechaVencimiento?.toISOString() ?? null,
      } : null}
      isLoggedIn={!!session?.user?.id}
    />
  )
}
