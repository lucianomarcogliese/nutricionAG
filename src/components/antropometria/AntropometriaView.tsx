"use client"

import { useEffect, useState } from "react"

interface Antropometria {
  id: string
  fecha: string
  pesoKg: number
  tallaCm: number
  imc: number | null
  brazoFlexionado: number | null
  toraxMesoesternal: number | null
  cinturaMinima: number | null
  caderaMaxima: number | null
  masaOseaKg: number | null
  masaGrasaKg: number | null
  porcentajeGrasa: number | null
  masaMuscularKg: number | null
  notas: string | null
  nutricionista: { id: string; nombre: string; color: string } | null
}

type DeltaDir = "up" | "down" | null

function delta(curr: number | null, prev: number | null): { diff: number; dir: DeltaDir } | null {
  if (curr === null || prev === null) return null
  const diff = Math.round((curr - prev) * 10) / 10
  return { diff, dir: diff > 0 ? "up" : diff < 0 ? "down" : null }
}

function DeltaBadge({ d, goodDir }: { d: ReturnType<typeof delta>; goodDir: "up" | "down" }) {
  if (!d || d.dir === null) return null
  const isGood = d.dir === goodDir
  const sign = d.diff > 0 ? "+" : ""
  const arrow = d.dir === "up" ? "↑" : "↓"
  return (
    <span className={`text-xs font-medium ${isGood ? "text-emerald-500" : "text-rose-400"}`}>
      {arrow} {sign}{d.diff}
    </span>
  )
}

function KpiCard({
  label,
  value,
  unit,
  secondaryValue,
  secondaryUnit,
  d,
  goodDir,
  color,
}: {
  label: string
  value: number | null
  unit: string
  secondaryValue?: number | null
  secondaryUnit?: string
  d: ReturnType<typeof delta>
  goodDir: "up" | "down"
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {value !== null ? (
        <>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-400">{unit}</p>
            {secondaryValue !== null && secondaryValue !== undefined && secondaryUnit && (
              <p className="text-sm text-gray-400">({secondaryValue}{secondaryUnit})</p>
            )}
          </div>
          <div className="mt-1 min-h-[1rem]">
            <DeltaBadge d={d} goodDir={goodDir} />
          </div>
        </>
      ) : (
        <p className="text-lg font-medium text-gray-300">—</p>
      )}
    </div>
  )
}

function FormulaCard({
  title,
  author,
  formula,
  result,
  example,
}: {
  title: string
  author?: string
  formula: string
  result: string | null
  example?: string
}) {
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-1.5">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {author && <p className="text-xs text-gray-400">({author})</p>}
      </div>
      <p className="text-xs font-mono bg-gray-50 rounded px-2 py-1 text-gray-600 leading-relaxed">
        {formula}
      </p>
      {example && (
        <p className="text-xs text-gray-500 italic">{example}</p>
      )}
      {result !== null && (
        <p className="text-xs text-gray-500">
          Tu resultado: <span className="font-semibold text-gray-700">{result}</span>
        </p>
      )}
    </div>
  )
}

export default function AntropometriaView() {
  const [data, setData] = useState<Antropometria[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormulas, setShowFormulas] = useState(false)

  useEffect(() => {
    fetch("/api/antropometria")
      .then((r) => r.json())
      .then((j) => setData(j.antropometrias ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="text-5xl mb-4">📏</div>
        <p className="font-medium">Tu nutricionista aún no registró mediciones.</p>
      </div>
    )
  }

  const latest = data[0]
  const prev = data[1] ?? null

  const pctMusculo =
    latest.masaMuscularKg !== null
      ? Math.round((latest.masaMuscularKg / latest.pesoKg) * 1000) / 10
      : null
  const prevPctMusculo =
    prev && prev.masaMuscularKg !== null
      ? Math.round((prev.masaMuscularKg / prev.pesoKg) * 1000) / 10
      : null

  const tallaM = (latest.tallaCm / 100).toFixed(2)
  const imcDisplay = latest.imc !== null
    ? latest.imc
    : Math.round(latest.pesoKg / Math.pow(latest.tallaCm / 100, 2) * 10) / 10

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mis Mediciones</h1>
        <p className="text-xs text-gray-400">
          Última: {new Date(latest.fecha).toLocaleDateString("es-AR")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Peso"
          value={latest.pesoKg}
          unit="kg"
          d={delta(latest.pesoKg, prev?.pesoKg ?? null)}
          goodDir="down"
          color="text-gray-700"
        />
        <KpiCard
          label="Bícep contraído"
          value={latest.brazoFlexionado}
          unit="cm"
          d={delta(latest.brazoFlexionado, prev?.brazoFlexionado ?? null)}
          goodDir="up"
          color="text-blue-600"
        />
        <KpiCard
          label="Tórax mesoesternal"
          value={latest.toraxMesoesternal}
          unit="cm"
          d={delta(latest.toraxMesoesternal, prev?.toraxMesoesternal ?? null)}
          goodDir="up"
          color="text-indigo-600"
        />
        <KpiCard
          label="Cintura mínima"
          value={latest.cinturaMinima}
          unit="cm"
          d={delta(latest.cinturaMinima, prev?.cinturaMinima ?? null)}
          goodDir="down"
          color="text-orange-500"
        />
        <KpiCard
          label="Caderas máxima"
          value={latest.caderaMaxima}
          unit="cm"
          d={delta(latest.caderaMaxima, prev?.caderaMaxima ?? null)}
          goodDir="down"
          color="text-orange-400"
        />
        <KpiCard
          label="Kg de hueso"
          value={latest.masaOseaKg}
          unit="kg"
          d={delta(latest.masaOseaKg, prev?.masaOseaKg ?? null)}
          goodDir="up"
          color="text-stone-500"
        />
        <KpiCard
          label="Kg de grasa"
          value={latest.masaGrasaKg}
          unit="kg"
          secondaryValue={latest.porcentajeGrasa}
          secondaryUnit="%"
          d={delta(latest.masaGrasaKg, prev?.masaGrasaKg ?? null)}
          goodDir="down"
          color="text-rose-500"
        />
        <KpiCard
          label="Kg de músculo"
          value={latest.masaMuscularKg}
          unit="kg"
          secondaryValue={pctMusculo}
          secondaryUnit="%"
          d={delta(latest.masaMuscularKg, prev?.masaMuscularKg ?? null)}
          goodDir="up"
          color="text-blue-700"
        />
      </div>

      {latest.notas && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
          <p className="text-xs font-medium text-gray-400 mb-1">Nota del nutricionista</p>
          {latest.notas}
        </div>
      )}

      {/* Sección de fórmulas */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFormulas((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span>¿Cómo se calculan estos valores?</span>
          <span className="text-gray-400">{showFormulas ? "▲" : "▼"}</span>
        </button>

        {showFormulas && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
            <FormulaCard
              title="IMC — Índice de Masa Corporal"
              formula="IMC = peso (kg) / talla (m)²"
              example={`Con tus datos: ${latest.pesoKg} / (${tallaM})² = ${imcDisplay}`}
              result={null}
            />

            {latest.porcentajeGrasa !== null && (
              <FormulaCard
                title="% Grasa corporal"
                author="Yuhasz, 6 pliegues"
                formula={[
                  "Σ6 = triceps + subescapular + supraespinal + abdominal + muslo medial + pantorrilla",
                  "Hombre: Σ6 × 0.1051 + 2.585",
                  "Mujer:  Σ6 × 0.1548 + 3.58",
                ].join("\n")}
                result={`${latest.porcentajeGrasa}%`}
              />
            )}

            {latest.masaMuscularKg !== null && (
              <FormulaCard
                title="Masa muscular esquelética"
                author="Lee et al."
                formula={[
                  "MM = talla(m) × [0.00744×Brazo_c² + 0.00088×Muslo_c² + 0.00441×Pantorrilla_c²]",
                  "     + 2.4×sexo − 0.048×edad + 7.8",
                  "X_c = perímetro − (pliegue / 10)  (corrección por grasa subcutánea)",
                ].join("\n")}
                result={`${latest.masaMuscularKg} kg`}
              />
            )}

            {latest.masaOseaKg !== null && (
              <FormulaCard
                title="Masa ósea"
                author="Martin"
                formula="MO = 3.02 × [talla(m)² × Ø femoral × Ø humeral × 400]^0.712 × 0.001"
                result={`${latest.masaOseaKg} kg`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
