"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Sex = "MALE" | "FEMALE" | "OTHER"
type Goal = "LOSE_WEIGHT" | "GAIN_MUSCLE" | "MAINTAIN"
type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTREMELY_ACTIVE"

interface FormData {
  fullName: string
  age: string
  weightKg: string
  heightCm: string
  sex: Sex | ""
  goal: Goal | ""
  activityLevel: ActivityLevel | ""
  dietaryRestrictions: string[]
  tipoActividad: string
  suplementosMedicacion: string
  noGusta: string
}

const INITIAL: FormData = {
  fullName: "",
  age: "",
  weightKg: "",
  heightCm: "",
  sex: "",
  goal: "",
  activityLevel: "",
  dietaryRestrictions: [],
  tipoActividad: "",
  suplementosMedicacion: "",
  noGusta: "",
}

const GOALS: { value: Goal; label: string; description: string; icon: string }[] = [
  { value: "LOSE_WEIGHT", label: "Perder peso", description: "Reducir grasa corporal de forma saludable", icon: "📉" },
  { value: "GAIN_MUSCLE", label: "Ganar músculo", description: "Aumentar masa muscular con entrenamiento", icon: "💪" },
  { value: "MAINTAIN", label: "Mantenerme", description: "Sostener mi peso y estado físico actual", icon: "⚖️" },
]

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "SEDENTARY", label: "Sedentario", description: "Sin ejercicio o muy poco" },
  { value: "LIGHTLY_ACTIVE", label: "Poco activo", description: "Ejercicio 1-3 días por semana" },
  { value: "MODERATELY_ACTIVE", label: "Moderadamente activo", description: "Ejercicio 3-5 días por semana" },
  { value: "VERY_ACTIVE", label: "Muy activo", description: "Ejercicio intenso 6-7 días por semana" },
  { value: "EXTREMELY_ACTIVE", label: "Extremadamente activo", description: "Entrenamiento físico profesional" },
]

const DIETARY_OPTIONS: { label: string; value: string }[] = [
  { label: "Sin gluten",      value: "GLUTEN_FREE" },
  { label: "Vegetariano",     value: "VEGETARIAN" },
  { label: "Vegano",          value: "VEGAN" },
  { label: "Sin lactosa",     value: "LACTOSE_FREE" },
  { label: "Sin mariscos",    value: "NO_SHELLFISH" },
  { label: "Sin frutos secos", value: "NO_NUTS" },
  { label: "Halal",           value: "HALAL" },
  { label: "Kosher",          value: "KOSHER" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { update } = useSession()
  const router = useRouter()

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function toggleRestriction(item: string) {
    setData((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(item)
        ? prev.dietaryRestrictions.filter((r) => r !== item)
        : [...prev.dietaryRestrictions, item],
    }))
  }

  function canAdvance() {
    if (step === 1) return data.fullName && data.age && data.weightKg && data.heightCm && data.sex
    if (step === 2) return !!data.goal
    return !!data.activityLevel
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")
    try {
      const payload = {
        ...data,
        age: parseInt(data.age, 10),
        weightKg: parseFloat(data.weightKg),
        heightCm: parseFloat(data.heightCm),
      }
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Error al guardar")
      }
      await update().catch(() => null)
      router.push("/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-3xl mb-3">🥗</span>
          <h1 className="text-2xl font-bold text-gray-900">Configurá tu perfil</h1>
          <p className="text-gray-500 mt-1 text-sm">Paso {step} de 3</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Step 1: Datos personales */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Datos personales</h2>
                <p className="text-sm text-gray-500">Usamos esta información para personalizar tu plan.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Tu nombre"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <input
                    type="number"
                    value={data.age}
                    onChange={(e) => set("age", e.target.value)}
                    placeholder="25"
                    min={10}
                    max={120}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={data.sex}
                    onChange={(e) => set("sex", e.target.value as Sex)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Seleccioná</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    value={data.weightKg}
                    onChange={(e) => set("weightKg", e.target.value)}
                    placeholder="70"
                    min={20}
                    max={400}
                    step={0.1}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={data.heightCm}
                    onChange={(e) => set("heightCm", e.target.value)}
                    placeholder="170"
                    min={50}
                    max={280}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Objetivo */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Cuál es tu objetivo?</h2>
                <p className="text-sm text-gray-500">Tu plan nutricional y de entrenamiento se adaptará a esto.</p>
              </div>

              <div className="space-y-3">
                {GOALS.map(({ value, label, description, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("goal", value)}
                    className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors duration-150 ${
                      data.goal === value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className={`font-medium ${data.goal === value ? "text-emerald-700" : "text-gray-900"}`}>
                        {label}
                      </p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <div className="ml-auto">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          data.goal === value ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                        }`}
                      >
                        {data.goal === value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Actividad y restricciones */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Actividad y alimentación</h2>
                <p className="text-sm text-gray-500">Últimos detalles para afinar tu plan.</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Nivel de actividad física</p>
                {ACTIVITY_LEVELS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("activityLevel", value)}
                    className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors duration-150 ${
                      data.activityLevel === value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${data.activityLevel === value ? "text-emerald-700" : "text-gray-900"}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        data.activityLevel === value ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                      }`}
                    >
                      {data.activityLevel === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ¿Qué tipo de actividad hacés?{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={data.tipoActividad}
                  onChange={(e) => set("tipoActividad", e.target.value)}
                  placeholder="ej: running, fútbol, gym, natación..."
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Restricciones alimentarias{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleRestriction(value)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                        data.dietaryRestrictions.includes(value)
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ¿Tomás algún suplemento o medicamento?{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={data.suplementosMedicacion}
                  onChange={(e) => set("suplementosMedicacion", e.target.value)}
                  placeholder="ej: proteína whey, creatina, metformina..."
                  rows={2}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
                />
                <p className="text-xs text-gray-400">Ayuda a personalizar tu plan.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ¿Qué no te gusta o no querés ver en tu plan?{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={data.noGusta}
                  onChange={(e) => set("noGusta", e.target.value)}
                  placeholder="Ej: no me gusta el brócoli, no quiero atún, evito el picante..."
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Atrás
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdvance() || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {loading ? "Guardando..." : "Empezar →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
