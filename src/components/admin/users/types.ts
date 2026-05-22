export interface UserProfile {
  fullName: string | null
  age: number | null
  weightKg: number | null
  heightCm: number | null
  sex: string | null
  goal: string | null
  activityLevel: string | null
  onboardingCompleted: boolean
  dietaryRestrictions: string[]
}

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
  profile: UserProfile | null
  _count: { appointments: number }
}

export interface Ejercicio {
  id: string
  routineId: string
  name: string
  sets: number
  reps: number
  orderIndex: number
}

export interface Rutina {
  id: string
  name: string
  description: string | null
  exercises: Ejercicio[]
}

export interface FoodItem {
  id: string
  name: string
  calories: string | number | null
  proteinG: string | number | null
  carbsG: string | number | null
  fatG: string | number | null
}

export interface Meal {
  id: string
  name: string
  orderIndex: number
  foodItems: FoodItem[]
}

export interface PlanNutricion {
  id: string
  name: string
  caloriesTarget: number | null
  meals: Meal[]
}

export interface ItemForm {
  nombre: string
  calorias: string
  proteinas: string
  carbos: string
  grasas: string
}
