import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getPermisos } from "@/lib/permisos"
import { RecetasView } from "@/components/recetas/RecetasView"

export default async function RecetasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/login")

  const permisos = await getPermisos(session.user.id)
  if (!permisos.verRecetas) redirect("/dashboard")

  return <RecetasView />
}
