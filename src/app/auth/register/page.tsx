import Link from "next/link"
import { redirect } from "next/navigation"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

async function registerUser(formData: FormData) {
  "use server"

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) return

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return

  const passwordHash = await hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  await prisma.profile.create({
    data: { userId: user.id, fullName: name },
  })

  redirect("/auth/login")
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
        <p className="text-gray-600 mb-6 text-sm">Comenzá tu camino con Claude Nutri</p>

        <form action={registerUser} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium transition-colors w-full"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/login" className="text-emerald-600 font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
