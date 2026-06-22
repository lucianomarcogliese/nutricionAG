export type SexCalc = "MALE" | "FEMALE"

export interface InputMedidas {
  pesoKg: number
  tallaCm: number
  edad: number
  sexo: SexCalc
  tallaSentado?: number           // para Masa Residual
  cinturaMinima?: number
  caderaMaxima?: number
  brazoRelajado?: number          // para Lee 5-sitios (brazo máximo relajado)
  brazoFlexionado?: number        // para somatotipo
  perimetroAntebrazo?: number     // para Lee 5-sitios
  toraxMesoesternal?: number      // para Lee 5-sitios
  musloSuperior?: number          // perímetro muslo máximo (para Lee 5-sitios)
  pantorrillaMaxima?: number
  pliegueSubescapular?: number
  pliegueTriceps?: number
  pliegueSupraespinal?: number
  pliegueAbdominal?: number
  pliegueMusloMedial?: number
  plieguePantorrilla?: number
  diametroBiacromial?: number     // para Masa Ósea cuerpo
  diametroBiiliocrestideo?: number // para Masa Ósea cuerpo
  diametroBiepicondileoFemoral?: number
  diametroBiepicondileoHumeral?: number
  diametroToraxTransverso?: number  // para Masa Residual
  diametroToraxAnteroposterior?: number // para Masa Residual
  diametroMunieca?: number
  perimetroCabeza?: number         // para Masa Ósea cabeza
}

export interface ResultadosCalculados {
  imc: number
  clasificacionIMC: string
  icc?: number
  clasificacionICC?: string
  porcentajeGrasa?: number        // Yuhasz %
  masaGrasaKg?: number            // Yuhasz % × Peso
  masaMagraKg?: number
  masaAdiposaKg?: number          // Phantom Score Z (5-componentes)
  masaMuscularKg?: number
  masaOseaKg?: number             // Masa Ósea Total (cabeza + cuerpo)
  masaOseaCabezaKg?: number
  masaOseaCuerpoKg?: number
  masaResidualKg?: number
  masaPielKg?: number
  areaSuperficial?: number
  endomorfismo?: number
  mesomorfismo?: number
  ectomorfismo?: number
  metabolismoBasalHarrisBenedict?: number
  metabolismoBasalKleiber?: number
}

// ─── IMC / ICC ────────────────────────────────────────────────────────────────

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

// ─── GRASA YUHASZ (% grasa y masa grasa derivada) ────────────────────────────

export function calcularGrasaYuhasz(
  pliegues: { subescapular: number; triceps: number; supraespinal: number; abdominal: number; musloMedial: number; pantorrilla: number },
  sexo: SexCalc
): number {
  const suma = pliegues.subescapular + pliegues.triceps + pliegues.supraespinal + pliegues.abdominal + pliegues.musloMedial + pliegues.pantorrilla
  if (sexo === "MALE") {
    return suma * 0.1051 + 2.585
  } else {
    return suma * 0.1548 + 3.58
  }
}

// ─── MASA ADIPOSA — Phantom Score Z (Ross & Wilson 1974) ─────────────────────
// Ref. Excel: Z = (Σ6×(170.18/talla) - 116.41) / 34.79
//             MA = (Z×5.85 + 25.6) / (170.18/talla)³
export function calcularMasaAdiposa(
  tallaCm: number,
  pliegues: { subescapular: number; triceps: number; supraespinal: number; abdominal: number; musloMedial: number; pantorrilla: number }
): { scoreZ: number; masaAdiposaKg: (pesoKg: number) => number; _masaBase: (pesoKg: number) => number } {
  const suma6 = pliegues.subescapular + pliegues.triceps + pliegues.supraespinal + pliegues.abdominal + pliegues.musloMedial + pliegues.pantorrilla
  const hRatio = 170.18 / tallaCm
  const scoreZ = (suma6 * hRatio - 116.41) / 34.79
  const masaAdiposaKg = (_peso: number) => (scoreZ * 5.85 + 25.6) / Math.pow(hRatio, 3)
  return { scoreZ, masaAdiposaKg, _masaBase: masaAdiposaKg }
}

// ─── MASA MUSCULAR — Lee 5 perímetros + Phantom Score Z ──────────────────────
// Perímetros corregidos: PC = perímetro - pliegue_mm × 3.141 / 10
// Ref. Excel: Z = (Σ5×(170.18/talla) - 207.21) / 13.74
//             MM = (Z×5.4 + 24.5) / (170.18/talla)³
export function calcularMasaMuscular5PC(
  tallaCm: number,
  brazoRelajado: number,
  perimetroAntebrazo: number,
  musloSuperior: number,
  pantorrillaMaxima: number,
  toraxMesoesternal: number,
  pliegueTriceps: number,
  pliegueMusloMedial: number,
  plieguePantorrilla: number,
  pliegueSubescapular: number
): { scoreZ: number; masaMuscularKg: number; perimetrosCorregidos: Record<string, number> } {
  const PI = 3.141
  const brazoCorr    = brazoRelajado     - (pliegueTriceps    * PI / 10)
  const antebrazo    = perimetroAntebrazo
  const musloCorr    = musloSuperior     - (pliegueMusloMedial * PI / 10)
  const pantCorr     = pantorrillaMaxima - (plieguePantorrilla * PI / 10)
  const toraxCorr    = toraxMesoesternal - (pliegueSubescapular * PI / 10)

  const suma5 = brazoCorr + antebrazo + musloCorr + pantCorr + toraxCorr
  const hRatio = 170.18 / tallaCm
  const scoreZ = (suma5 * hRatio - 207.21) / 13.74
  const masaMuscularKg = (scoreZ * 5.4 + 24.5) / Math.pow(hRatio, 3)

  return {
    scoreZ,
    masaMuscularKg,
    perimetrosCorregidos: { brazoCorr, antebrazo, musloCorr, pantCorr, toraxCorr, suma5 }
  }
}

// ─── MASA RESIDUAL — Phantom Score Z (usando talla sentado) ──────────────────
// Ref. Excel: CintCorr = cintura - abd×0.3141
//             Σ = ToraxT + ToraxAP + CintCorr
//             Z = (Σ×(89.92/tallaSentado) - 109.35) / 7.08
//             MR = (Z×1.24 + 6.1) / (89.92/tallaSentado)³
export function calcularMasaResidual(
  tallaSentadoCm: number,
  cinturaMinima: number,
  pliegueAbdominal: number,
  diametroToraxTransverso: number,
  diametroToraxAnteroposterior: number
): { scoreZ: number; masaResidualKg: number } {
  const cinturaCorr = cinturaMinima - pliegueAbdominal * 0.3141
  const sumaTorax = diametroToraxTransverso + diametroToraxAnteroposterior + cinturaCorr
  const sRatio = 89.92 / tallaSentadoCm
  const scoreZ = (sumaTorax * sRatio - 109.35) / 7.08
  const masaResidualKg = (scoreZ * 1.24 + 6.1) / Math.pow(sRatio, 3)
  return { scoreZ, masaResidualKg }
}

// ─── MASA ÓSEA — Phantom Score Z ─────────────────────────────────────────────
// Cabeza: Z = (perCabeza - 56) / 1.44 ; MO_cab = Z×0.18 + 1.2
// Cuerpo: Σ4D = Biacromial + BiIliocrestideo + Humeral×2 + Femoral×2
//         Z = (Σ4D×(170.18/talla) - 98.88) / 5.33
//         MO_cuerpo = (Z×1.34 + 6.7) / (170.18/talla)³
export function calcularMasaOseaCabeza(perimetroCabeza: number): { scoreZ: number; masaOseaCabezaKg: number } {
  const scoreZ = (perimetroCabeza - 56) / 1.44
  const masaOseaCabezaKg = scoreZ * 0.18 + 1.2
  return { scoreZ, masaOseaCabezaKg }
}

export function calcularMasaOseaCuerpo(
  tallaCm: number,
  diametroBiacromial: number,
  diametroBiiliocrestideo: number,
  diametroBiepicondileoHumeral: number,
  diametroBiepicondileoFemoral: number
): { scoreZ: number; masaOseaCuerpoKg: number } {
  const sumaDiam = diametroBiacromial + diametroBiiliocrestideo + diametroBiepicondileoHumeral * 2 + diametroBiepicondileoFemoral * 2
  const hRatio = 170.18 / tallaCm
  const scoreZ = (sumaDiam * hRatio - 98.88) / 5.33
  const masaOseaCuerpoKg = (scoreZ * 1.34 + 6.7) / Math.pow(hRatio, 3)
  return { scoreZ, masaOseaCuerpoKg }
}

// ─── MASA PIEL — Du Bois (1916) con constantes por sexo ──────────────────────
// Ref. Excel: AS = (constante × Peso^0.425 × Talla^0.725) / 10000
//             Masa = AS × grosor × 1.05
// Constantes: Femenino >12 años = 73.074 ; Masculino >12 años = 68.308
export function calcularMasaPiel(
  pesoKg: number,
  tallaCm: number,
  sexo: SexCalc
): { areaSuperficial: number; masaPielKg: number } {
  const constante = sexo === "MALE" ? 68.308 : 73.074
  const areaSuperficial = (constante * Math.pow(pesoKg, 0.425) * Math.pow(tallaCm, 0.725)) / 10000
  const grosor = sexo === "MALE" ? 2.07 : 1.96
  const masaPielKg = areaSuperficial * grosor * 1.05
  return { areaSuperficial, masaPielKg }
}

// ─── SOMATOTIPO Heath & Carter (1990) ────────────────────────────────────────
// Endomorfismo: SumSF = (Tri+Sub+Sup)×(170.18/talla); fórmula cúbica
// Mesomorfismo: 0.858×D_hum + 0.601×D_fem + 0.188×(BrazFlex-Tri/10) + 0.161×(Pant-PantPl/10) - 0.131×Talla + 4.5
//              (los diámetros óseos NO se corrigen por pliegues)
// Ectomorfismo: HWR = Talla/Peso^(1/3)
export function calcularSomatotipo(
  pesoKg: number,
  tallaCm: number,
  pliegues: { triceps: number; subescapular: number; supraespinal: number; pantorrilla: number },
  diametros: { humeral: number; femoral: number },
  circunferencias: { brazo: number; pantorrilla: number; pliegueTriceps: number; plieguePantorrilla: number }
): { endomorfismo: number; mesomorfismo: number; ectomorfismo: number } {
  // Endomorfismo — suma 3 pliegues corregida a 170.18 cm
  const sumaTresPl = pliegues.triceps + pliegues.subescapular + pliegues.supraespinal
  const sumaCorr = sumaTresPl * (170.18 / tallaCm)
  const endo = -0.7182 + 0.1451 * sumaCorr - 0.00068 * sumaCorr ** 2 + 0.0000014 * sumaCorr ** 3

  // Mesomorfismo — diámetros sin corrección + perímetros corregidos con SF/10 (sin π)
  const brazoCorr = circunferencias.brazo - circunferencias.pliegueTriceps / 10
  const pantCorr  = circunferencias.pantorrilla - circunferencias.plieguePantorrilla / 10
  const meso = 0.858 * diametros.humeral + 0.601 * diametros.femoral + 0.188 * brazoCorr + 0.161 * pantCorr - tallaCm * 0.131 + 4.5

  // Ectomorfismo
  const hwr = tallaCm / Math.pow(pesoKg, 1 / 3)
  let ectoFinal: number
  if (hwr >= 40.75) ectoFinal = 0.732 * hwr - 28.58
  else if (hwr >= 38.28) ectoFinal = 0.463 * hwr - 17.63
  else ectoFinal = 0.1

  return {
    endomorfismo: Math.max(0, Math.round(endo * 10) / 10),
    mesomorfismo: Math.max(0, Math.round(meso * 10) / 10),
    ectomorfismo: Math.max(0, Math.round(ectoFinal * 10) / 10),
  }
}

// ─── METABOLISMO BASAL ────────────────────────────────────────────────────────
// Harris-Benedict: coeficientes del Excel (versión redondeada 1919)
// Kleiber (1975): 67.6 × Peso^0.75
export function calcularMetabolismoBasal(
  pesoKg: number,
  tallaCm: number,
  edad: number,
  sexo: SexCalc
): { harrisBenedict: number; kleiber: number } {
  const harrisBenedict = sexo === "MALE"
    ? 66 + 13.7 * pesoKg + 5 * tallaCm - 6.8 * edad
    : 655 + 9.6 * pesoKg + 1.7 * tallaCm - 4.7 * edad
  const kleiber = 67.6 * Math.pow(pesoKg, 0.75)
  return { harrisBenedict, kleiber }
}

// ─── ORQUESTADOR PRINCIPAL ────────────────────────────────────────────────────

export function calcularTodo(input: InputMedidas): ResultadosCalculados {
  const imc = calcularIMC(input.pesoKg, input.tallaCm)
  const result: ResultadosCalculados = {
    imc: Math.round(imc * 10) / 10,
    clasificacionIMC: clasificarIMC(imc),
  }

  // ICC
  if (input.cinturaMinima && input.caderaMaxima) {
    const icc = calcularICC(input.cinturaMinima, input.caderaMaxima)
    result.icc = Math.round(icc * 100) / 100
    result.clasificacionICC = clasificarICC(icc, input.sexo)
  }

  // Masa Piel (siempre disponible con peso y talla)
  const { areaSuperficial, masaPielKg } = calcularMasaPiel(input.pesoKg, input.tallaCm, input.sexo)
  result.areaSuperficial = Math.round(areaSuperficial * 1000) / 1000
  result.masaPielKg = Math.round(masaPielKg * 10) / 10

  // Metabolismo Basal (siempre disponible)
  const { harrisBenedict, kleiber } = calcularMetabolismoBasal(input.pesoKg, input.tallaCm, input.edad, input.sexo)
  result.metabolismoBasalHarrisBenedict = Math.round(harrisBenedict * 10) / 10
  result.metabolismoBasalKleiber = Math.round(kleiber * 10) / 10

  // Yuhasz % grasa (6 pliegues)
  const tieneYuhasz =
    input.pliegueSubescapular !== undefined &&
    input.pliegueTriceps !== undefined &&
    input.pliegueSupraespinal !== undefined &&
    input.pliegueAbdominal !== undefined &&
    input.pliegueMusloMedial !== undefined &&
    input.plieguePantorrilla !== undefined

  if (tieneYuhasz) {
    const pct = calcularGrasaYuhasz(
      {
        subescapular: input.pliegueSubescapular!,
        triceps: input.pliegueTriceps!,
        supraespinal: input.pliegueSupraespinal!,
        abdominal: input.pliegueAbdominal!,
        musloMedial: input.pliegueMusloMedial!,
        pantorrilla: input.plieguePantorrilla!,
      },
      input.sexo
    )
    result.porcentajeGrasa = Math.round(pct * 10) / 10
    result.masaGrasaKg = Math.round(input.pesoKg * (pct / 100) * 10) / 10
    result.masaMagraKg = Math.round((input.pesoKg - result.masaGrasaKg) * 10) / 10

    // Masa Adiposa Phantom (mismos 6 pliegues)
    const adiposa = calcularMasaAdiposa(input.tallaCm, {
      subescapular: input.pliegueSubescapular!,
      triceps: input.pliegueTriceps!,
      supraespinal: input.pliegueSupraespinal!,
      abdominal: input.pliegueAbdominal!,
      musloMedial: input.pliegueMusloMedial!,
      pantorrilla: input.plieguePantorrilla!,
    })
    result.masaAdiposaKg = Math.round(adiposa.masaAdiposaKg(input.pesoKg) * 10) / 10
  }

  // Masa Muscular — Lee 5 perímetros + Phantom Z-score
  if (
    input.brazoRelajado !== undefined &&
    input.perimetroAntebrazo !== undefined &&
    input.musloSuperior !== undefined &&
    input.pantorrillaMaxima !== undefined &&
    input.toraxMesoesternal !== undefined &&
    input.pliegueTriceps !== undefined &&
    input.pliegueMusloMedial !== undefined &&
    input.plieguePantorrilla !== undefined &&
    input.pliegueSubescapular !== undefined
  ) {
    const muscular = calcularMasaMuscular5PC(
      input.tallaCm,
      input.brazoRelajado,
      input.perimetroAntebrazo,
      input.musloSuperior,
      input.pantorrillaMaxima,
      input.toraxMesoesternal,
      input.pliegueTriceps,
      input.pliegueMusloMedial,
      input.plieguePantorrilla,
      input.pliegueSubescapular
    )
    result.masaMuscularKg = Math.round(muscular.masaMuscularKg * 10) / 10
  }

  // Masa Ósea — cabeza
  if (input.perimetroCabeza !== undefined) {
    const { masaOseaCabezaKg } = calcularMasaOseaCabeza(input.perimetroCabeza)
    result.masaOseaCabezaKg = Math.round(masaOseaCabezaKg * 10) / 10
  }

  // Masa Ósea — cuerpo (4 diámetros)
  if (
    input.diametroBiacromial !== undefined &&
    input.diametroBiiliocrestideo !== undefined &&
    input.diametroBiepicondileoHumeral !== undefined &&
    input.diametroBiepicondileoFemoral !== undefined
  ) {
    const { masaOseaCuerpoKg } = calcularMasaOseaCuerpo(
      input.tallaCm,
      input.diametroBiacromial,
      input.diametroBiiliocrestideo,
      input.diametroBiepicondileoHumeral,
      input.diametroBiepicondileoFemoral
    )
    result.masaOseaCuerpoKg = Math.round(masaOseaCuerpoKg * 10) / 10

    if (result.masaOseaCabezaKg !== undefined) {
      result.masaOseaKg = Math.round((result.masaOseaCabezaKg + masaOseaCuerpoKg) * 10) / 10
    }
  }

  // Masa Residual (requiere talla sentado + cintura + tórax + pliegue abdominal)
  if (
    input.tallaSentado !== undefined &&
    input.cinturaMinima !== undefined &&
    input.pliegueAbdominal !== undefined &&
    input.diametroToraxTransverso !== undefined &&
    input.diametroToraxAnteroposterior !== undefined
  ) {
    const { masaResidualKg } = calcularMasaResidual(
      input.tallaSentado,
      input.cinturaMinima,
      input.pliegueAbdominal,
      input.diametroToraxTransverso,
      input.diametroToraxAnteroposterior
    )
    result.masaResidualKg = Math.round(masaResidualKg * 10) / 10
  }

  // Somatotipo Heath & Carter
  if (
    input.pliegueTriceps !== undefined &&
    input.pliegueSubescapular !== undefined &&
    input.pliegueSupraespinal !== undefined &&
    input.plieguePantorrilla !== undefined &&
    input.diametroBiepicondileoHumeral !== undefined &&
    input.diametroBiepicondileoFemoral !== undefined &&
    input.brazoFlexionado !== undefined &&
    input.pantorrillaMaxima !== undefined
  ) {
    const soma = calcularSomatotipo(
      input.pesoKg,
      input.tallaCm,
      {
        triceps: input.pliegueTriceps,
        subescapular: input.pliegueSubescapular,
        supraespinal: input.pliegueSupraespinal,
        pantorrilla: input.plieguePantorrilla,
      },
      {
        humeral: input.diametroBiepicondileoHumeral,
        femoral: input.diametroBiepicondileoFemoral,
      },
      {
        brazo: input.brazoFlexionado,
        pantorrilla: input.pantorrillaMaxima,
        pliegueTriceps: input.pliegueTriceps,
        plieguePantorrilla: input.plieguePantorrilla,
      }
    )
    result.endomorfismo = soma.endomorfismo
    result.mesomorfismo = soma.mesomorfismo
    result.ectomorfismo = soma.ectomorfismo
  }

  return result
}
