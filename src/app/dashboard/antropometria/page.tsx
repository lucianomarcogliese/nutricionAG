import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import AntropometriaView from "@/components/antropometria/AntropometriaView"

export default async function AntropometriaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/login")

  return <AntropometriaView />
}
