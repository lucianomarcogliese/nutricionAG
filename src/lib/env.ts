import { z } from "zod"

const envSchema = z.object({
  // Auth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // MercadoPago
  MP_ACCESS_TOKEN: z.string().min(1, "MP_ACCESS_TOKEN is required"),
  MP_WEBHOOK_SECRET: z.string().min(1, "MP_WEBHOOK_SECRET is required"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Pusher
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID is required"),
  PUSHER_KEY: z.string().min(1, "PUSHER_KEY is required"),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET is required"),
  PUSHER_CLUSTER: z.string().min(1, "PUSHER_CLUSTER is required"),

  // Email
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),

  // Optional
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`)
  throw new Error(`Missing or invalid environment variables:\n${missing.join("\n")}`)
}

export const env = result.data
