export type SexCalc = "MALE" | "FEMALE"

export interface InputMedidas {
  pesoKg: number
  tallaCm: number
  edad: number
  sexo: SexCalc
  cinturaCm?: number
  caderaCm?: number
  brazoCm?: number
  musloDerechoCm?: number
  pantorrillaDerechaCm?: number
  pliegueSubescapular?: number
  pliegueTriceps?: number
  pliegueSuprailiaco?: number
  pliegueAbdominal?: number
  pliegueMusloAnterior?: number
  plieguePantorrilla?: number
  pliegueAxilarMedio?: number
  plieguePectoral?: number
  diametroBiepicondileoFemoral?: number
  diametroBiepicondileoHumeral?: number
  diametroMunieca?: number
}

export interface ResultadosCalculados {
  imc: number
  clasificacionIMC: string
  icc?: number
  clasificacionICC?: string
  porcentajeGrasa?: number
  masaGrasaKg?: number
  masaMagraKg?: number
  masaOseaKg?: number
  masaMuscularKg?: number
  endomorfismo?: number
  mesomorfismo?: number
  ectomorfismo?: number
}

export function calcularIMC(pesoKg: number, tallaCm: number): number {
  const tallaM = tallaCm / 100
  return pesoKg / (tallaM * tallaM)
}

export function clasificarIMC(imc: number): string {
  if (imc < 18.5) return "Bajo peso"
  if (imc < 25) return "Normal"
  if (imc < 30) return "Sobrepeso"
  if (imc < 35) return "Obesidad grado I"
  if (imc < 40) return "Obesidad grado II"
  return "Obesidad grado III"
}

export function calcularICC(cinturaCm: number, caderaCm: number): number {
  return cinturaCm / caderaCm
}

export function clasificarICC(icc: number, sexo: SexCalc): string {
  if (sexo === "MALE") {
    if (icc < 0.9) return "Bajo riesgo"
    if (icc < 1.0) return "Riesgo moderado"
    return "Alto riesgo"
  } else {
    if (icc < 0.8) return "Bajo riesgo"
    if (icc < 0.85) return "Riesgo moderado"
    return "Alto riesgo"
  }
}

// Yuhasz 6 pliegues — porcentaje de grasa corporal
export function calcularGrasaYuhasz(
  pliegues: { subescapular: number; triceps: number; suprailiaco: number; abdominal: number; musloAnterior: number; pantorrilla: number },
  sexo: SexCalc
): number {
  const suma = pliegues.subescapular + pliegues.triceps + pliegues.suprailiaco + pliegues.abdominal + pliegues.musloAnterior + pliegues.pantorrilla
  if (sexo === "MALE") {
    return suma * 0.1051 + 2.585
  } else {
    return suma * 0.1548 + 3.58
  }
}

// Martin — masa ósea (kg)
// Fórmula: 3.02 × [(talla_m)² × D_femoral_cm × D_humeral_cm × 400]^0.712 × 0.001
export function calcularMasaOseaMartin(tallaCm: number, diametroFemoral: number, diametroHumeral: number): number {
  const tallaM = tallaCm / 100
  return 3.02 * Math.pow(tallaM * tallaM * diametroFemoral * diametroHumeral * 400, 0.712) * 0.001
}

// Lee — masa muscular esquelética (kg)
// Fórmula: talla_m × (0.00744×CAG² + 0.00088×CTG² + 0.00441×CCG²) + 2.4×sex - 0.048×edad + 7.8
export function calcularMasaMuscularLee(
  tallaCm: number,
  brazo: number,
  muslo: number,
  pantorrilla: number,
  pliegueTriceps: number,
  pliegueMuslo: number,
  plieguePantorrilla: number,
  sexo: SexCalc,
  edad: number
): number {
  const tallaM = tallaCm / 100
  const sexVal = sexo === "MALE" ? 1 : 0
  const brCorr = brazo - pliegueTriceps / 10
  const thCorr = muslo - pliegueMuslo / 10
  const caCorr = pantorrilla - plieguePantorrilla / 10
  return tallaM * (
    0.00744 * Math.pow(brCorr, 2) +
    0.00088 * Math.pow(thCorr, 2) +
    0.00441 * Math.pow(caCorr, 2)
  ) + 2.4 * sexVal - 0.048 * edad + 7.8
}

// Heath-Carter — somatotipo
export function calcularSomatotipo(
  pesoKg: number,
  tallaCm: number,
  pliegues: { triceps: number; subescapular: number; suprailiaco: number; pantorrilla: number },
  diametros: { humeral: number; femoral: number },
  circunferencias: { brazo: number; pantorrilla: number; pliegueTriceps: number; plieguePantorrilla: number }
): { endomorfismo: number; mesomorfismo: number; ectomorfismo: number } {
  // Endomorfismo
  const sumaTresPl = pliegues.triceps + pliegues.subescapular + pliegues.suprailiaco
  const corrFactor = 170.18 / tallaCm
  const sumaCorr = sumaTresPl * corrFactor
  const endo = -0.7182 + 0.1451 * sumaCorr - 0.00068 * sumaCorr ** 2 + 0.0000014 * sumaCorr ** 3

  // Mesomorfismo
  const humeralCorr = diametros.humeral - circunferencias.pliegueTriceps / 10
  const femoralCorr = diametros.femoral
  const brazoCorr = circunferencias.brazo - circunferencias.pliegueTriceps / 10
  const pantCorr = circunferencias.pantorrilla - circunferencias.plieguePantorrilla / 10
  const meso = 0.858 * humeralCorr + 0.601 * femoralCorr + 0.188 * brazoCorr + 0.161 * pantCorr - tallaCm * 0.131 + 4.5

  // Ectomorfismo
  const imc = pesoKg / Math.pow(tallaCm / 100, 2)
  let ecto: number
  if (imc <= 17.28) ecto = 0.1
  else if (imc < 20.85) ecto = -0.221 * imc + 4.5
  else ecto = Math.max(0.1, 0.732 * (pesoKg / Math.pow(tallaCm / 100, 3) * 1000) - 28.58)
  // Simpler ectomorph from height-weight ratio
  const hwr = tallaCm / Math.pow(pesoKg, 1/3)
  let ectoFinal: number
  if (hwr >= 40.75) ectoFinal = 0.732 * hwr - 28.58
  else if (hwr >= 38.25) ectoFinal = 0.463 * hwr - 17.63
  else ectoFinal = 0.1

  return {
    endomorfismo: Math.max(0, Math.round(endo * 10) / 10),
    mesomorfismo: Math.max(0, Math.round(meso * 10) / 10),
    ectomorfismo: Math.max(0, Math.round(ectoFinal * 10) / 10),
  }
}

export function calcularTodo(input: InputMedidas): ResultadosCalculados {
  const imc = calcularIMC(input.pesoKg, input.tallaCm)
  const result: ResultadosCalculados = {
    imc: Math.round(imc * 10) / 10,
    clasificacionIMC: clasificarIMC(imc),
  }

  if (input.cinturaCm && input.caderaCm) {
    const icc = calcularICC(input.cinturaCm, input.caderaCm)
    result.icc = Math.round(icc * 100) / 100
    result.clasificacionICC = clasificarICC(icc, input.sexo)
  }

  const tieneYuhasz =
    input.pliegueSubescapular !== undefined &&
    input.pliegueTriceps !== undefined &&
    input.pliegueSuprailiaco !== undefined &&
    input.pliegueAbdominal !== undefined &&
    input.pliegueMusloAnterior !== undefined &&
    input.plieguePantorrilla !== undefined

  if (tieneYuhasz) {
    const pct = calcularGrasaYuhasz(
      {
        subescapular: input.pliegueSubescapular!,
        triceps: input.pliegueTriceps!,
        suprailiaco: input.pliegueSuprailiaco!,
        abdominal: input.pliegueAbdominal!,
        musloAnterior: input.pliegueMusloAnterior!,
        pantorrilla: input.plieguePantorrilla!,
      },
      input.sexo
    )
    result.porcentajeGrasa = Math.round(pct * 10) / 10
    result.masaGrasaKg = Math.round(input.pesoKg * (pct / 100) * 10) / 10
    result.masaMagraKg = Math.round((input.pesoKg - result.masaGrasaKg) * 10) / 10
  }

  const tieneMartin =
    input.diametroBiepicondileoFemoral !== undefined &&
    input.diametroBiepicondileoHumeral !== undefined

  if (tieneMartin) {
    result.masaOseaKg =
      Math.round(
        calcularMasaOseaMartin(
          input.tallaCm,
          input.diametroBiepicondileoFemoral!,
          input.diametroBiepicondileoHumeral!
        ) * 10
      ) / 10
  }

  if (
    input.brazoCm !== undefined &&
    input.musloDerechoCm !== undefined &&
    input.pantorrillaDerechaCm !== undefined &&
    input.pliegueTriceps !== undefined &&
    input.pliegueMusloAnterior !== undefined &&
    input.plieguePantorrilla !== undefined
  ) {
    result.masaMuscularKg =
      Math.round(
        calcularMasaMuscularLee(
          input.tallaCm,
          input.brazoCm,
          input.musloDerechoCm,
          input.pantorrillaDerechaCm,
          input.pliegueTriceps!,
          input.pliegueMusloAnterior!,
          input.plieguePantorrilla!,
          input.sexo,
          input.edad
        ) * 10
      ) / 10
  }

  if (
    input.pliegueTriceps !== undefined &&
    input.pliegueSubescapular !== undefined &&
    input.pliegueSuprailiaco !== undefined &&
    input.plieguePantorrilla !== undefined &&
    input.diametroBiepicondileoHumeral !== undefined &&
    input.diametroBiepicondileoFemoral !== undefined &&
    input.brazoCm !== undefined &&
    input.pantorrillaDerechaCm !== undefined
  ) {
    const soma = calcularSomatotipo(
      input.pesoKg,
      input.tallaCm,
      {
        triceps: input.pliegueTriceps!,
        subescapular: input.pliegueSubescapular!,
        suprailiaco: input.pliegueSuprailiaco!,
        pantorrilla: input.plieguePantorrilla!,
      },
      {
        humeral: input.diametroBiepicondileoHumeral!,
        femoral: input.diametroBiepicondileoFemoral!,
      },
      {
        brazo: input.brazoCm!,
        pantorrilla: input.pantorrillaDerechaCm!,
        pliegueTriceps: input.pliegueTriceps!,
        plieguePantorrilla: input.plieguePantorrilla!,
      }
    )
    result.endomorfismo = soma.endomorfismo
    result.mesomorfismo = soma.mesomorfismo
    result.ectomorfismo = soma.ectomorfismo
  }

  return result
}
