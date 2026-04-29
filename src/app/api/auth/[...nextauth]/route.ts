import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user?.passwordHash) return null

          const valid = await compare(credentials.password, user.passwordHash)
          if (!valid) return null

          return { id: user.id, name: user.name, email: user.email, image: user.image }
        } catch (err) {
          console.error("[authorize] error:", err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id
          const [profile, dbUser] = await Promise.all([
            prisma.profile.findUnique({
              where: { userId: user.id },
              select: { id: true, subscriptionStatus: true, onboardingCompleted: true },
            }),
            prisma.user.findUnique({
              where: { id: user.id },
              select: { role: true, nutricionistaId: true },
            }),
          ])
          token.profileId = profile?.id ?? ""
          token.subscriptionStatus = profile?.subscriptionStatus ?? "FREE"
          token.onboardingCompleted = profile?.onboardingCompleted ?? false
          token.role = dbUser?.role ?? "USER"
          token.nutricionistaId = dbUser?.nutricionistaId ?? undefined
          token.roleCheckedAt = Date.now()
          return token
        }

        if (trigger === "update" && token.id) {
          const [profile, dbUser] = await Promise.all([
            prisma.profile.findUnique({
              where: { userId: token.id as string },
              select: { id: true, subscriptionStatus: true, onboardingCompleted: true },
            }),
            prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, nutricionistaId: true },
            }),
          ])
          if (profile) {
            token.profileId = profile.id
            token.subscriptionStatus = profile.subscriptionStatus
            token.onboardingCompleted = profile.onboardingCompleted
          }
          if (dbUser) {
            token.role = dbUser.role
            token.nutricionistaId = dbUser.nutricionistaId ?? undefined
          }
          token.roleCheckedAt = Date.now()
          return token
        }

        // Verificar cada 5 minutos si el role cambió en DB
        // Solo si roleCheckedAt ya existe (tokens nuevos ya lo tienen seteado al hacer login)
        const FIVE_MIN = 5 * 60 * 1000
        const checkedAt = token.roleCheckedAt as number | undefined
        if (token.id && checkedAt !== undefined && Date.now() > checkedAt + FIVE_MIN) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, nutricionistaId: true },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.nutricionistaId = dbUser.nutricionistaId ?? undefined
          }
          token.roleCheckedAt = Date.now()
        }
      } catch (err) {
        console.error("[jwt callback] error:", err)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.profileId = token.profileId
        session.user.subscriptionStatus = token.subscriptionStatus
        session.user.onboardingCompleted = token.onboardingCompleted
        session.user.nutricionistaId = token.nutricionistaId
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          fullName: user.name ?? null,
          avatarUrl: user.image ?? null,
        },
      })
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
