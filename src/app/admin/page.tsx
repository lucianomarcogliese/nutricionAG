import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AdminDashboard } from "@/components/admin/AdminDashboard"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect("/dashboard")

  const role = session.user.role
  if (role !== "ADMIN" && role !== "NUTRICIONISTA" && role !== "RECEPCIONISTA") redirect("/dashboard")

  return (
    <AdminDashboard
      role={role}
      nutricionistaId={session.user.nutricionistaId}
    />
  )
}
