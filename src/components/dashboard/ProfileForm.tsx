'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

type Sex = 'MALE' | 'FEMALE' | 'OTHER'
type Goal = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN'
type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTREMELY_ACTIVE'

export type ProfileData = {
  fullName: string | null
  age: number | null
  weightKg: number | null
  heightCm: number | null
  sex: Sex | null
  goal: Goal | null
  activityLevel: ActivityLevel | null
  dietaryRestrictions: string[]
}

const DIETARY_OPTIONS = [
  { label: 'Sin gluten',        value: 'GLUTEN_FREE' },
  { label: 'Vegetariano',       value: 'VEGETARIAN' },
  { label: 'Vegano',            value: 'VEGAN' },
  { label: 'Sin lactosa',       value: 'LACTOSE_FREE' },
  { label: 'Sin mariscos',      value: 'NO_SHELLFISH' },
  { label: 'Sin frutos secos',  value: 'NO_NUTS' },
  { label: 'Halal',             value: 'HALAL' },
  { label: 'Kosher',            value: 'KOSHER' },
]

const inputClass =
  'border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none'

const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

type Props = {
  profile: ProfileData
}

export function ProfileForm({ profile }: Props) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(profile.weightKg?.toString() ?? '')
  const [heightCm, setHeightCm] = useState(profile.heightCm?.toString() ?? '')
  const [sex, setSex] = useState<Sex | ''>(profile.sex ?? '')
  const [goal, setGoal] = useState<Goal | ''>(profile.goal ?? '')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(profile.activityLevel ?? '')
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    profile.dietaryRestrictions ?? []
  )

  const [loading, setLoading] = useState(false)

  function toggleDiet(value: string) {
    setDietaryRestrictions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          age,
          weightKg,
          heightCm,
          sex,
          goal,
          activityLevel,
          dietaryRestrictions,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json()
        const message =
          data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Error al guardar'
        toast({ message, type: 'error' })
      } else {
        toast({ message: 'Perfil actualizado correctamente', type: 'success' })
      }
    } catch {
      toast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Editar perfil</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nombre completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Edad</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={10}
            max={120}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Peso (kg)</label>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            min={20}
            max={400}
            step={0.1}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Altura (cm)</label>
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            min={50}
            max={280}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sexo</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            required
            className={inputClass}
          >
            <option value="" disabled>Seleccioná</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Objetivo</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            required
            className={inputClass}
          >
            <option value="" disabled>Seleccioná</option>
            <option value="LOSE_WEIGHT">Perder peso</option>
            <option value="GAIN_MUSCLE">Ganar músculo</option>
            <option value="MAINTAIN">Mantenerme</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Nivel de actividad</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            required
            className={inputClass}
          >
            <option value="" disabled>Seleccioná</option>
            <option value="SEDENTARY">Sedentario</option>
            <option value="LIGHTLY_ACTIVE">Poco activo</option>
            <option value="MODERATELY_ACTIVE">Moderadamente activo</option>
            <option value="VERY_ACTIVE">Muy activo</option>
            <option value="EXTREMELY_ACTIVE">Extremadamente activo</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Restricciones dietéticas</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DIETARY_OPTIONS.map((opt) => {
              const active = dietaryRestrictions.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDiet(opt.value)}
                  className={
                    active
                      ? 'px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 py-2 font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
