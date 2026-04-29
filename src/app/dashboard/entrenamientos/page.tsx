import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EntrenamientosView } from '@/components/entrenamientos/EntrenamientosView'

export default async function EntrenamientosPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <EntrenamientosView />
}
