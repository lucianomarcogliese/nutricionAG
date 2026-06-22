import { prisma } from "./prisma"

export interface HeroContent {
  headline: string
  subheadline: string
}

export interface Feature {
  emoji: string
  titulo: string
  descripcion: string
}

export interface TeamMember {
  nombre: string
  matricula: string
  rol: string
  especialidades: string[]
}

export interface Plan {
  nombre: string
  precio: string
  moneda: string
  periodo: string
  destacado: boolean
  features: string[]
  cta: string
}

export interface LandingData {
  hero: HeroContent
  features: Feature[]
  equipo: TeamMember[]
  planes: Plan[]
}

const SECCIONES = ["hero", "features", "equipo", "planes"] as const
export type Seccion = (typeof SECCIONES)[number]
export const VALID_SECCIONES: string[] = [...SECCIONES]

export const LANDING_DEFAULTS: LandingData = {
  hero: {
    headline: "Alcanzá tu mejor versión con nutrición personalizada e inteligencia artificial",
    subheadline: "Planes nutricionales y rutinas de entrenamiento diseñados por profesionales y potenciados por IA",
  },
  features: [
    { emoji: "Salad",    titulo: "Planes nutricionales personalizados", descripcion: "Generados con IA en base a tu perfil, objetivos y restricciones alimentarias" },
    { emoji: "Dumbbell", titulo: "Rutinas de entrenamiento",            descripcion: "Diseñadas por licenciados en educación física adaptadas a tu nivel" },
    { emoji: "BarChart2",titulo: "Seguimiento de progreso",             descripcion: "Controlá tus calorías, macros y evolución semana a semana" },
  ],
  equipo: [
    { nombre: "Agustín Goñi", matricula: "MN11428", rol: "Fundador", especialidades: ["Nutrición deportiva", "Nutrición clínica", "Antropometría"] },
    { nombre: "Lucas Gari", matricula: "MN11907", rol: "Nutricionista", especialidades: ["Nutrición deportiva", "Suplementación", "Deportes de fuerza"] },
    { nombre: "Camila Fuentes", matricula: "MN12937", rol: "Nutricionista", especialidades: ["Running", "Trail", "Ironman", "Descenso de peso"] },
  ],
  planes: [
    { nombre: "Gratis", precio: "0", moneda: "USD", periodo: "mes", destacado: false, features: ["Acceso al dashboard", "1 plan nutricional", "1 rutina de entrenamiento", "Seguimiento básico"], cta: "Empezar gratis" },
    { nombre: "Pro", precio: "9.99", moneda: "USD", periodo: "mes", destacado: true, features: ["Todo lo del plan Gratis", "Planes ilimitados con IA", "Rutinas ilimitadas", "Seguimiento avanzado de macros", "Soporte prioritario"], cta: "Elegir Pro" },
    { nombre: "Premium", precio: "19.99", moneda: "USD", periodo: "mes", destacado: false, features: ["Todo lo del plan Pro", "Consultas con profesionales", "Plan personalizado por nutricionistas", "Antropometría digital"], cta: "Elegir Premium" },
  ],
}

export async function getLandingContent(): Promise<LandingData> {
  const rows = await prisma.landingContent.findMany()

  if (rows.length < SECCIONES.length) {
    await Promise.all(
      SECCIONES.map((sec) =>
        prisma.landingContent.upsert({
          where: { seccion: sec },
          create: { seccion: sec, contenido: LANDING_DEFAULTS[sec] as object },
          update: {},
        })
      )
    )
    return LANDING_DEFAULTS
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {}
  for (const row of rows) {
    result[row.seccion] = row.contenido
  }
  return result as LandingData
}
