import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-1">Actualizá tu información personal</p>
        </div>

        <ProfileForm
          profile={{
            fullName: profile.fullName,
            age: profile.age,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            sex: profile.sex,
            goal: profile.goal,
            activityLevel: profile.activityLevel,
            dietaryRestrictions: profile.dietaryRestrictions,
          }}
        />
      </div>
    </div>
  )
}
