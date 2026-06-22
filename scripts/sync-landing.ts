import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const LANDING_SYNC = {
  hero: {
    headline: "Alcanzá tu mejor versión con nutrición personalizada e inteligencia artificial",
    subheadline:
      "Planes nutricionales y rutinas de entrenamiento diseñados por profesionales y potenciados por IA",
  },
  features: [
    {
      emoji: "Salad",
      titulo: "Planes nutricionales personalizados",
      descripcion: "Generados con IA en base a tu perfil, objetivos y restricciones alimentarias",
    },
    {
      emoji: "Dumbbell",
      titulo: "Rutinas de entrenamiento",
      descripcion: "Diseñadas por licenciados en educación física adaptadas a tu nivel",
    },
    {
      emoji: "BarChart2",
      titulo: "Seguimiento de progreso",
      descripcion: "Controlá tus calorías, macros y evolución semana a semana",
    },
  ],
  equipo: [
    {
      nombre: "Agustín Goñi",
      matricula: "MN11428",
      rol: "Fundador",
      especialidades: ["Nutrición deportiva", "Nutrición clínica", "Antropometría"],
    },
    {
      nombre: "Lucas Gari",
      matricula: "MN11907",
      rol: "Nutricionista",
      especialidades: ["Nutrición deportiva", "Suplementación", "Deportes de fuerza"],
    },
    {
      nombre: "Camila Fuentes",
      matricula: "MN12937",
      rol: "Nutricionista",
      especialidades: ["Running", "Trail", "Ironman", "Descenso de peso"],
    },
  ],
  planes: [
    {
      nombre: "Gratis",
      precio: "0",
      moneda: "USD",
      periodo: "mes",
      destacado: false,
      features: [
        "Acceso al dashboard",
        "1 plan nutricional",
        "1 rutina de entrenamiento",
        "Seguimiento básico",
      ],
      cta: "Empezar gratis",
    },
    {
      nombre: "Pro",
      precio: "9.99",
      moneda: "USD",
      periodo: "mes",
      destacado: true,
      features: [
        "Todo lo del plan Gratis",
        "Planes ilimitados con IA",
        "Rutinas ilimitadas",
        "Seguimiento avanzado de macros",
        "Soporte prioritario",
      ],
      cta: "Elegir Pro",
    },
    {
      nombre: "Premium",
      precio: "19.99",
      moneda: "USD",
      periodo: "mes",
      destacado: false,
      features: [
        "Todo lo del plan Pro",
        "Consultas con profesionales",
        "Plan personalizado por nutricionistas",
        "Antropometría digital",
      ],
      cta: "Elegir Premium",
    },
  ],
}

async function main() {
  const secciones = Object.entries(LANDING_SYNC) as [string, unknown][]
  for (const [seccion, contenido] of secciones) {
    await prisma.landingContent.upsert({
      where: { seccion },
      create: { seccion, contenido: contenido as object },
      update: { contenido: contenido as object }, // ← fuerza la actualización
    })
    console.log(`✓ ${seccion} sincronizado`)
  }
  console.log("\nLanding sincronizada con los valores actuales del código.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
