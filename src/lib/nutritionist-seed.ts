import { prisma } from "@/lib/prisma"

const SEED_NUTRITIONISTS = [
  {
    nombre: "Agustín Goñi",
    matricula: "MN11428",
    especialidades: ["Nutrición deportiva", "Nutrición clínica", "Antropometría"],
    color: "#10b981",
  },
  {
    nombre: "Lucas Gari",
    matricula: "MN11907",
    especialidades: ["Nutrición deportiva", "Suplementación", "Deportes de fuerza"],
    color: "#3b82f6",
  },
  {
    nombre: "Camila Fuentes",
    matricula: "MN12937",
    especialidades: ["Running", "Trail", "Ironman", "Descenso de peso"],
    color: "#f59e0b",
  },
]

export async function seedNutritionists() {
  for (const n of SEED_NUTRITIONISTS) {
    await prisma.nutritionist.upsert({
      where: { matricula: n.matricula },
      update: { nombre: n.nombre, especialidades: n.especialidades, color: n.color },
      create: { ...n, activo: true },
    })
  }
}

export async function ensureNutritionistSeed() {
  const count = await prisma.nutritionist.count()
  if (count === 0) {
    await seedNutritionists()
  }
}
