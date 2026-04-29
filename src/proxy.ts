import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const path = req.nextUrl.pathname

    const role = token?.role as string | undefined

    // Roles especiales: ADMIN, NUTRICIONISTA, RECEPCIONISTA
    if (role === "ADMIN" || role === "NUTRICIONISTA" || role === "RECEPCIONISTA") {
      // Si intentan acceder a rutas de paciente → redirigir a /admin
      if (path.startsWith("/dashboard") || path === "/onboarding") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      // Acceso libre a /admin
      return NextResponse.next()
    }

    // Usuarios USER → verificar onboarding
    if (!token?.onboardingCompleted && path !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    if (token?.onboardingCompleted && path === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/auth/login" },
  }
)

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/onboarding", "/admin/:path*", "/admin"],
}
