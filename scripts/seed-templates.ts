import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding nutrition templates...")

  // Limpiar templates existentes para evitar duplicados
  await prisma.templateOpcion.deleteMany()
  await prisma.templateGrupo.deleteMany()
  await prisma.templateComida.deleteMany()
  await prisma.templatePlan.deleteMany()

  // ─── Template 1: Déficit calórico estándar ───────────────────────────────

  const t1 = await prisma.templatePlan.create({
    data: {
      nombre: "Déficit calórico estándar",
      descripcion: "Para pacientes con objetivo de reducción de grasa corporal manteniendo masa muscular.",
      objetivo: "DEFICIT_CALORICO",
      recomendaciones: `IMPORTANTE: Pesar los alimentos en cocido.
PAPA, BATATA y CHOCLO no cuentan como verduras, son hidratos de carbono.
Utilizar la medida indicada de aceite, no usar chorrito directo de la botella.
Consumir alimentos fuente de proteína en todas las comidas.
Aumentar la ingesta de líquidos: 1,5 a 3 litros de agua por día.
Aumentar la ingesta de frutas y verduras de distintos colores.
Evitar frituras, preferir cocción al vapor, hervido o microondas.
Evitar comprar ultraprocesados.
Uso libre de: jugo de limón, mostaza, orégano, aceto, vinagre, salsa de soja reducida en sodio, romero, tomillo, ají molido.`,
      suplementos: null,
    },
  })

  // Desayuno / Merienda
  const c1_desayuno = await prisma.templateComida.create({
    data: {
      templateId: t1.id,
      nombre: "Desayuno / Merienda",
      orden: 1,
      nota: null,
      ideasMenu: `Café con leche descremada con tostada untada con queso untable descremado, con huevo revuelto y 1 manzana.
Té con leche descremada con galletas de arroz untadas con queso untable descremado y fetas de queso port salut light.
Maté con panqueque proteico: avena + claras de huevo + 1 banana + untado con mermelada light.`,
    },
  })

  // Hidratos
  const g1_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c1_desayuno.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_hidratos.id, texto: "1 feta de pan lactal integral 25gr", orden: 1 },
      { grupoId: g1_hidratos.id, texto: "3 galletas de arroz", orden: 2 },
      { grupoId: g1_hidratos.id, texto: "3 cdas soperas de avena instantánea", orden: 3 },
      { grupoId: g1_hidratos.id, texto: "3 cdas de granola sin azúcar", orden: 4 },
      { grupoId: g1_hidratos.id, texto: "2 rapiditas integrales", orden: 5 },
    ],
  })

  // Proteínas
  const g1_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c1_desayuno.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_proteinas.id, texto: "1 huevo + 3 claras de huevo", orden: 1 },
      { grupoId: g1_proteinas.id, texto: "3 fetas de queso port salut light (90gr)", orden: 2 },
      { grupoId: g1_proteinas.id, texto: "1 yogurt descremado 180gr", orden: 3 },
      { grupoId: g1_proteinas.id, texto: "1 lata de atún al agua", orden: 4 },
    ],
  })

  // Frutas
  const g1_frutas = await prisma.templateGrupo.create({
    data: { comidaId: c1_desayuno.id, nombre: "Frutas", orden: 3 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_frutas.id, texto: "1 unidad chica 100gr (manzana, ½ banana, 1 naranja, 1 mandarina, 1 kiwi, 1 taza de frutillas, 1 pera, 1 durazno)", orden: 1 },
    ],
  })

  // Grasas
  const g1_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c1_desayuno.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_grasas.id, texto: "1 cda mantequilla de maní", orden: 1 },
      { grupoId: g1_grasas.id, texto: "5 almendras", orden: 2 },
      { grupoId: g1_grasas.id, texto: "10 maníes", orden: 3 },
      { grupoId: g1_grasas.id, texto: "10 aceitunas", orden: 4 },
      { grupoId: g1_grasas.id, texto: "1 cda de palta", orden: 5 },
      { grupoId: g1_grasas.id, texto: "5 castañas de cajú", orden: 6 },
    ],
  })

  // Colación media mañana
  const c1_colacion1 = await prisma.templateComida.create({
    data: {
      templateId: t1.id,
      nombre: "Colación media mañana",
      orden: 2,
      nota: "HIDRATACIÓN CON AGUA",
      ideasMenu: null,
    },
  })
  const g1_colacion1 = await prisma.templateGrupo.create({
    data: { comidaId: c1_colacion1.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_colacion1.id, texto: "1 fruta grande", orden: 1 },
      { grupoId: g1_colacion1.id, texto: "1 huevo duro", orden: 2 },
      { grupoId: g1_colacion1.id, texto: "1 yogurt descremado 120gr", orden: 3 },
    ],
  })

  // Almuerzo
  const c1_almuerzo = await prisma.templateComida.create({
    data: {
      templateId: t1.id,
      nombre: "Almuerzo",
      orden: 3,
      nota: null,
      ideasMenu: `Pechuga de pollo grille con arroz yamaní y ensalada de mix de verdes condimentado con aceite de oliva.
Lomo de cuadril con fideos integrales y ensalada de zanahoria, tomate y cebolla con aceitunas.
Filet de merluza con batata al horno y brócoli condimentado con palta.`,
    },
  })

  const g1_alm_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c1_almuerzo.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_alm_hidratos.id, texto: "100gr de papa, batata, boniato o choclo (1 unidad chica)", orden: 1 },
      { grupoId: g1_alm_hidratos.id, texto: "½ taza en cocido de fideos (100gr)", orden: 2 },
      { grupoId: g1_alm_hidratos.id, texto: "6 cdas soperas de arroz integral, quinoa, lentejas o garbanzos (120gr)", orden: 3 },
      { grupoId: g1_alm_hidratos.id, texto: "1 feta de pan integral", orden: 4 },
    ],
  })

  const g1_alm_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c1_almuerzo.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_alm_proteinas.id, texto: "220gr en cocido de carne magra (lomo, cuadril, peceto, nalga, bola de lomo)", orden: 1 },
      { grupoId: g1_alm_proteinas.id, texto: "Pollo o pavita sin piel (preferentemente pechuga) 220gr", orden: 2 },
      { grupoId: g1_alm_proteinas.id, texto: "Cerdo magro (carré, solomillo) 220gr", orden: 3 },
      { grupoId: g1_alm_proteinas.id, texto: "Pescados (atún al agua, brótola, merluza, bacalao — salmón con menos frecuencia) 220gr", orden: 4 },
      { grupoId: g1_alm_proteinas.id, texto: "1 huevo + 5 claras de huevo (omelet, tortillas, revueltos)", orden: 5 },
    ],
  })

  const g1_alm_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c1_almuerzo.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_alm_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido ó 200gr en cocido (NO INCLUYE PAPA NI BATATA): acelga, ají, berenjena, brócoli, coliflor, espinaca, espárrago, hinojo, lechuga, pepino, repollo, rúcula, tomate, zapallito, alcaucil, cebolla, puerro, remolacha, zanahoria", orden: 1 },
    ],
  })

  const g1_alm_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c1_almuerzo.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_alm_grasas.id, texto: "1 cdita de aceite (oliva, canola, girasol, maíz, lino)", orden: 1 },
      { grupoId: g1_alm_grasas.id, texto: "5 almendras", orden: 2 },
      { grupoId: g1_alm_grasas.id, texto: "10 maníes", orden: 3 },
      { grupoId: g1_alm_grasas.id, texto: "10 aceitunas", orden: 4 },
      { grupoId: g1_alm_grasas.id, texto: "1 cda de palta", orden: 5 },
      { grupoId: g1_alm_grasas.id, texto: "2 cdas de semillas", orden: 6 },
    ],
  })

  // Colación media tarde
  const c1_colacion2 = await prisma.templateComida.create({
    data: {
      templateId: t1.id,
      nombre: "Colación media tarde",
      orden: 4,
      nota: "HIDRATACIÓN CON AGUA",
      ideasMenu: null,
    },
  })
  const g1_colacion2 = await prisma.templateGrupo.create({
    data: { comidaId: c1_colacion2.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_colacion2.id, texto: "1 fruta grande", orden: 1 },
      { grupoId: g1_colacion2.id, texto: "1 huevo duro", orden: 2 },
      { grupoId: g1_colacion2.id, texto: "1 yogurt descremado 120gr", orden: 3 },
    ],
  })

  // Cena
  const c1_cena = await prisma.templateComida.create({
    data: {
      templateId: t1.id,
      nombre: "Cena",
      orden: 5,
      nota: null,
      ideasMenu: `Hamburguesas caseras con puré de coliflor, tomate y cebolla condimentado con aceite de oliva.
Brótola con champignones y ensalada de verdes condimentado con semillas.
Tortilla de acelga con omelet de huevos y ensalada a gusto condimentado con palta.`,
    },
  })

  const g1_cena_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c1_cena.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g1_cena_hidratos.id, texto: "SIN CARBOHIDRATOS POR LA NOCHE", orden: 1 },
  })

  const g1_cena_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c1_cena.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_cena_proteinas.id, texto: "220gr en cocido de carne magra (lomo, cuadril, peceto, nalga, bola de lomo)", orden: 1 },
      { grupoId: g1_cena_proteinas.id, texto: "Pollo o pavita sin piel (preferentemente pechuga) 220gr", orden: 2 },
      { grupoId: g1_cena_proteinas.id, texto: "Cerdo magro (carré, solomillo) 220gr", orden: 3 },
      { grupoId: g1_cena_proteinas.id, texto: "Pescados (atún al agua, brótola, merluza, bacalao) 220gr", orden: 4 },
      { grupoId: g1_cena_proteinas.id, texto: "1 huevo + 5 claras de huevo (omelet, tortillas, revueltos)", orden: 5 },
    ],
  })

  const g1_cena_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c1_cena.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g1_cena_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido ó 200gr en cocido: acelga, ají, berenjena, brócoli, coliflor, espinaca, espárrago, hinojo, lechuga, pepino, repollo, rúcula, tomate, zapallito, alcaucil, cebolla, puerro, remolacha, zanahoria", orden: 1 },
  })

  const g1_cena_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c1_cena.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g1_cena_grasas.id, texto: "1 cdita de aceite (oliva, canola, girasol, maíz, lino)", orden: 1 },
      { grupoId: g1_cena_grasas.id, texto: "5 almendras", orden: 2 },
      { grupoId: g1_cena_grasas.id, texto: "10 maníes", orden: 3 },
      { grupoId: g1_cena_grasas.id, texto: "10 aceitunas", orden: 4 },
      { grupoId: g1_cena_grasas.id, texto: "1 cda de palta", orden: 5 },
      { grupoId: g1_cena_grasas.id, texto: "2 cdas de semillas", orden: 6 },
    ],
  })

  console.log("✓ Template 1: Déficit calórico estándar")

  // ─── Template 2: Ganancia muscular ───────────────────────────────────────────

  const t2 = await prisma.templatePlan.create({
    data: {
      nombre: "Ganancia muscular",
      descripcion: "Para pacientes con objetivo de aumento de masa muscular con superávit calórico controlado.",
      objetivo: "GANANCIA_MUSCULAR",
      recomendaciones: `IMPORTANTE: Pesar los alimentos en cocido.
Mantener un superávit calórico moderado (300–500 kcal por encima del mantenimiento).
Distribuir la ingesta proteica en todas las comidas (mínimo 25–30g por comida).
Consumir hidratos alrededor del entrenamiento: antes y después.
Aumentar la ingesta de líquidos: 2–3 litros de agua por día.
Evitar frituras, preferir cocción al vapor, hervido, grille o horno.
Priorizar alimentos enteros y minimizar ultraprocesados.
Uso libre de: jugo de limón, mostaza, orégano, aceto, vinagre, salsa de soja reducida en sodio.`,
      suplementos: `Proteína en polvo (whey o vegetal): 1 scoop post-entrenamiento (opcional).
Creatina monohidrato: 3–5g/día con agua.
Consultar con el profesional antes de incorporar cualquier suplemento.`,
    },
  })

  // Desayuno
  const c2_desayuno = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Desayuno",
      orden: 1,
      nota: null,
      ideasMenu: `Tostadas con mantequilla de maní, 2 huevos revueltos y 1 banana.
Avena con leche descremada, canela, 1 banana y nueces.
Panqueque proteico: avena + 2 huevos + claras + mantequilla de maní.`,
    },
  })

  const g2_des_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c2_desayuno.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_des_hidratos.id, texto: "2 fetas de pan lactal integral (50gr)", orden: 1 },
      { grupoId: g2_des_hidratos.id, texto: "5 cdas soperas de avena instantánea", orden: 2 },
      { grupoId: g2_des_hidratos.id, texto: "5 cdas de granola sin azúcar", orden: 3 },
      { grupoId: g2_des_hidratos.id, texto: "4 rapiditas integrales", orden: 4 },
    ],
  })

  const g2_des_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c2_desayuno.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_des_proteinas.id, texto: "2 huevos + 4 claras de huevo", orden: 1 },
      { grupoId: g2_des_proteinas.id, texto: "5 fetas de queso port salut light (150gr)", orden: 2 },
      { grupoId: g2_des_proteinas.id, texto: "1 yogurt griego natural 200gr + 1 cda de miel", orden: 3 },
      { grupoId: g2_des_proteinas.id, texto: "2 latas de atún al agua", orden: 4 },
    ],
  })

  const g2_des_frutas = await prisma.templateGrupo.create({
    data: { comidaId: c2_desayuno.id, nombre: "Frutas", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g2_des_frutas.id, texto: "1 banana ó 2 unidades medianas (manzana, naranja, pera, durazno, mandarina)", orden: 1 },
  })

  const g2_des_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c2_desayuno.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_des_grasas.id, texto: "2 cdas mantequilla de maní", orden: 1 },
      { grupoId: g2_des_grasas.id, texto: "10 almendras o nueces", orden: 2 },
      { grupoId: g2_des_grasas.id, texto: "2 cdas de palta", orden: 3 },
    ],
  })

  // Colación media mañana
  const c2_colacion1 = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Colación media mañana",
      orden: 2,
      nota: "IDEAL PRE-ENTRENAMIENTO si entrena al mediodía",
      ideasMenu: null,
    },
  })
  const g2_col1 = await prisma.templateGrupo.create({
    data: { comidaId: c2_colacion1.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_col1.id, texto: "1 banana + 1 puñado de almendras (15 unidades)", orden: 1 },
      { grupoId: g2_col1.id, texto: "1 yogurt griego 200gr + 1 fruta", orden: 2 },
      { grupoId: g2_col1.id, texto: "2 huevos duros + 1 fruta", orden: 3 },
      { grupoId: g2_col1.id, texto: "30gr de frutos secos mixtos", orden: 4 },
    ],
  })

  // Almuerzo
  const c2_almuerzo = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Almuerzo",
      orden: 3,
      nota: null,
      ideasMenu: `Pechuga de pollo grille con arroz yamaní, batata al horno y ensalada de verdes.
Lomo de cuadril con fideos integrales, zanahoria y palta.
Salmón grille con arroz integral y espárragos salteados con aceite de oliva.`,
    },
  })

  const g2_alm_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c2_almuerzo.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_alm_hidratos.id, texto: "150gr de papa, batata, boniato o choclo", orden: 1 },
      { grupoId: g2_alm_hidratos.id, texto: "1 taza en cocido de fideos (200gr)", orden: 2 },
      { grupoId: g2_alm_hidratos.id, texto: "8 cdas soperas de arroz integral, quinoa o legumbres (180gr)", orden: 3 },
      { grupoId: g2_alm_hidratos.id, texto: "2 fetas de pan integral", orden: 4 },
    ],
  })

  const g2_alm_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c2_almuerzo.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_alm_proteinas.id, texto: "300gr en cocido de carne magra (lomo, cuadril, peceto, nalga)", orden: 1 },
      { grupoId: g2_alm_proteinas.id, texto: "300gr de pollo o pavita sin piel (preferentemente pechuga)", orden: 2 },
      { grupoId: g2_alm_proteinas.id, texto: "300gr de cerdo magro (carré, solomillo)", orden: 3 },
      { grupoId: g2_alm_proteinas.id, texto: "300gr de pescados (atún, brótola, merluza, salmón)", orden: 4 },
      { grupoId: g2_alm_proteinas.id, texto: "2 huevos + 6 claras de huevo", orden: 5 },
    ],
  })

  const g2_alm_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c2_almuerzo.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g2_alm_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido ó 200gr en cocido: acelga, ají, berenjena, brócoli, coliflor, espinaca, espárrago, hinojo, lechuga, pepino, repollo, rúcula, tomate, zapallito, alcaucil, cebolla, puerro, remolacha, zanahoria", orden: 1 },
  })

  const g2_alm_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c2_almuerzo.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_alm_grasas.id, texto: "1 cda de aceite de oliva o canola", orden: 1 },
      { grupoId: g2_alm_grasas.id, texto: "2 cdas de palta", orden: 2 },
      { grupoId: g2_alm_grasas.id, texto: "10 almendras o nueces", orden: 3 },
      { grupoId: g2_alm_grasas.id, texto: "2 cdas de semillas (chía, lino, girasol)", orden: 4 },
    ],
  })

  // Colación media tarde
  const c2_colacion2 = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Colación media tarde",
      orden: 4,
      nota: "IDEAL PRE o POST-ENTRENAMIENTO si entrena a la tarde",
      ideasMenu: null,
    },
  })
  const g2_col2 = await prisma.templateGrupo.create({
    data: { comidaId: c2_colacion2.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_col2.id, texto: "1 banana + 1 puñado de almendras (15 unidades)", orden: 1 },
      { grupoId: g2_col2.id, texto: "1 yogurt griego 200gr + 1 fruta", orden: 2 },
      { grupoId: g2_col2.id, texto: "Batido proteico: 1 scoop proteína en polvo + leche o agua + 1 banana", orden: 3 },
    ],
  })

  // Cena
  const c2_cena = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Cena",
      orden: 5,
      nota: null,
      ideasMenu: `Pechuga de pollo con arroz integral y ensalada de rúcula con tomate.
Merluza al horno con puré de papa/batata y brócoli salteado.
Tortilla proteica (4 huevos) con ensalada y pan integral.`,
    },
  })

  const g2_cena_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c2_cena.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_cena_hidratos.id, texto: "100gr de papa, batata o boniato", orden: 1 },
      { grupoId: g2_cena_hidratos.id, texto: "6 cdas de arroz integral o quinoa (120gr)", orden: 2 },
      { grupoId: g2_cena_hidratos.id, texto: "1 feta de pan integral", orden: 3 },
    ],
  })

  const g2_cena_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c2_cena.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_cena_proteinas.id, texto: "250gr de pollo o pavita sin piel", orden: 1 },
      { grupoId: g2_cena_proteinas.id, texto: "250gr de pescado (merluza, brótola, atún)", orden: 2 },
      { grupoId: g2_cena_proteinas.id, texto: "250gr de carne magra (lomo, peceto)", orden: 3 },
      { grupoId: g2_cena_proteinas.id, texto: "2 huevos + 5 claras de huevo", orden: 4 },
    ],
  })

  const g2_cena_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c2_cena.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g2_cena_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido ó 200gr: acelga, brócoli, coliflor, espinaca, lechuga, tomate, zapallito, espárrago, rúcula, pepino", orden: 1 },
  })

  const g2_cena_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c2_cena.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_cena_grasas.id, texto: "1 cdita de aceite de oliva", orden: 1 },
      { grupoId: g2_cena_grasas.id, texto: "2 cdas de palta", orden: 2 },
      { grupoId: g2_cena_grasas.id, texto: "10 aceitunas", orden: 3 },
    ],
  })

  // Post-entrenamiento
  const c2_post = await prisma.templateComida.create({
    data: {
      templateId: t2.id,
      nombre: "Post-entrenamiento",
      orden: 6,
      nota: "Consumir dentro de los 30-60 minutos post-entrenamiento",
      ideasMenu: null,
    },
  })
  const g2_post = await prisma.templateGrupo.create({
    data: { comidaId: c2_post.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g2_post.id, texto: "Batido: 1 scoop de proteína en polvo + agua o leche descremada", orden: 1 },
      { grupoId: g2_post.id, texto: "4 claras de huevo + 4 cdas de avena (cocido con agua)", orden: 2 },
      { grupoId: g2_post.id, texto: "1 yogurt griego 200gr + 1 banana", orden: 3 },
    ],
  })

  console.log("✓ Template 2: Ganancia muscular")

  // ─── Template 3: Vegetariano ──────────────────────────────────────────────────

  const t3 = await prisma.templatePlan.create({
    data: {
      nombre: "Vegetariano",
      descripcion: "Plan para pacientes vegetarianos que no consumen carnes. Incluye huevos y lácteos.",
      objetivo: "VEGETARIANO",
      recomendaciones: `IMPORTANTE: Pesar los alimentos en cocido.
Combinar proteínas vegetales para obtener aminoácidos esenciales (ej: legumbres + cereales).
Prestar especial atención a: proteína total diaria, vitamina B12, hierro no hemo, zinc y calcio.
Incluir fuente de vitamina C junto a alimentos con hierro para mejorar su absorción.
Consumir alimentos fuente de proteína en todas las comidas.
Aumentar la ingesta de líquidos: 1,5 a 3 litros de agua por día.
Evitar frituras, preferir cocción al vapor, hervido o horno.
Uso libre de: jugo de limón, mostaza, orégano, aceto, vinagre, salsa de soja reducida en sodio.`,
      suplementos: `Vitamina B12: suplementar según indicación médica (esencial en vegetarianos).
Hierro: consultar niveles con análisis de sangre antes de suplementar.
Vitamina D: evaluar con profesional de salud.`,
    },
  })

  // Desayuno
  const c3_desayuno = await prisma.templateComida.create({
    data: {
      templateId: t3.id,
      nombre: "Desayuno / Merienda",
      orden: 1,
      nota: null,
      ideasMenu: `Té con leche descremada con tostadas untadas con queso untable y huevo revuelto con espinaca.
Yogurt natural con granola sin azúcar, frutas y semillas de chía.
Avena con leche de avena, banana y mantequilla de maní.`,
    },
  })

  const g3_des_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c3_desayuno.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_des_hidratos.id, texto: "2 fetas de pan lactal integral (50gr)", orden: 1 },
      { grupoId: g3_des_hidratos.id, texto: "3 cdas soperas de avena instantánea", orden: 2 },
      { grupoId: g3_des_hidratos.id, texto: "3 cdas de granola sin azúcar", orden: 3 },
      { grupoId: g3_des_hidratos.id, texto: "4 galletas de arroz", orden: 4 },
    ],
  })

  const g3_des_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c3_desayuno.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_des_proteinas.id, texto: "2 huevos (revueltos, poché, duro o tortilla)", orden: 1 },
      { grupoId: g3_des_proteinas.id, texto: "1 yogurt griego natural 200gr", orden: 2 },
      { grupoId: g3_des_proteinas.id, texto: "100gr de queso ricota descremada", orden: 3 },
      { grupoId: g3_des_proteinas.id, texto: "3 fetas de queso port salut light (90gr)", orden: 4 },
    ],
  })

  const g3_des_frutas = await prisma.templateGrupo.create({
    data: { comidaId: c3_desayuno.id, nombre: "Frutas", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g3_des_frutas.id, texto: "1 unidad chica 100gr (manzana, ½ banana, 1 naranja, 1 kiwi, 1 taza de frutillas, 1 pera)", orden: 1 },
  })

  const g3_des_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c3_desayuno.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_des_grasas.id, texto: "1 cda mantequilla de maní o almendras", orden: 1 },
      { grupoId: g3_des_grasas.id, texto: "10 almendras, nueces o castañas de cajú", orden: 2 },
      { grupoId: g3_des_grasas.id, texto: "1 cda de semillas (chía, lino, girasol)", orden: 3 },
      { grupoId: g3_des_grasas.id, texto: "1 cda de palta", orden: 4 },
    ],
  })

  // Colación media mañana
  const c3_colacion1 = await prisma.templateComida.create({
    data: {
      templateId: t3.id,
      nombre: "Colación media mañana",
      orden: 2,
      nota: "HIDRATACIÓN CON AGUA",
      ideasMenu: null,
    },
  })
  const g3_col1 = await prisma.templateGrupo.create({
    data: { comidaId: c3_colacion1.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_col1.id, texto: "1 fruta + 10 almendras o nueces", orden: 1 },
      { grupoId: g3_col1.id, texto: "1 yogurt descremado 120gr", orden: 2 },
      { grupoId: g3_col1.id, texto: "1 huevo duro + 1 fruta", orden: 3 },
    ],
  })

  // Almuerzo
  const c3_almuerzo = await prisma.templateComida.create({
    data: {
      templateId: t3.id,
      nombre: "Almuerzo",
      orden: 3,
      nota: null,
      ideasMenu: `Lentejas estofadas con arroz integral y ensalada de rúcula con tomate y aceite de oliva.
Tortilla de espinaca y queso con ensalada de pepino, tomate y palta.
Garbanzos salteados con vegetales y quinoa con semillas.`,
    },
  })

  const g3_alm_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c3_almuerzo.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_alm_hidratos.id, texto: "100gr de papa, batata o boniato", orden: 1 },
      { grupoId: g3_alm_hidratos.id, texto: "½ taza en cocido de fideos integrales (100gr)", orden: 2 },
      { grupoId: g3_alm_hidratos.id, texto: "6 cdas soperas de arroz integral o quinoa (120gr)", orden: 3 },
    ],
  })

  const g3_alm_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c3_almuerzo.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_alm_proteinas.id, texto: "150gr de legumbres en cocido (lentejas, garbanzos, porotos, soja)", orden: 1 },
      { grupoId: g3_alm_proteinas.id, texto: "150gr de tofu firme (grille, salteado u horneado)", orden: 2 },
      { grupoId: g3_alm_proteinas.id, texto: "100gr de seitán (trigo gluten)", orden: 3 },
      { grupoId: g3_alm_proteinas.id, texto: "3 huevos (tortilla, revuelto, poché)", orden: 4 },
      { grupoId: g3_alm_proteinas.id, texto: "100gr de queso fresco o ricota + 2 huevos", orden: 5 },
    ],
  })

  const g3_alm_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c3_almuerzo.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g3_alm_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido ó 200gr en cocido: acelga, ají, berenjena, brócoli, coliflor, espinaca, espárrago, hinojo, lechuga, pepino, repollo, rúcula, tomate, zapallito, alcaucil, cebolla, puerro, remolacha, zanahoria", orden: 1 },
  })

  const g3_alm_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c3_almuerzo.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_alm_grasas.id, texto: "1 cdita de aceite de oliva o lino", orden: 1 },
      { grupoId: g3_alm_grasas.id, texto: "2 cdas de palta", orden: 2 },
      { grupoId: g3_alm_grasas.id, texto: "1 cda de semillas mixtas (chía, lino, girasol, zapallo)", orden: 3 },
      { grupoId: g3_alm_grasas.id, texto: "10 aceitunas", orden: 4 },
    ],
  })

  // Colación media tarde
  const c3_colacion2 = await prisma.templateComida.create({
    data: {
      templateId: t3.id,
      nombre: "Colación media tarde",
      orden: 4,
      nota: "HIDRATACIÓN CON AGUA",
      ideasMenu: null,
    },
  })
  const g3_col2 = await prisma.templateGrupo.create({
    data: { comidaId: c3_colacion2.id, nombre: "Opciones", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_col2.id, texto: "1 fruta + 10 almendras o nueces", orden: 1 },
      { grupoId: g3_col2.id, texto: "1 yogurt descremado 120gr", orden: 2 },
      { grupoId: g3_col2.id, texto: "Hummus casero (4 cdas) con 5 galletas de arroz o bastones de zanahoria", orden: 3 },
    ],
  })

  // Cena
  const c3_cena = await prisma.templateComida.create({
    data: {
      templateId: t3.id,
      nombre: "Cena",
      orden: 5,
      nota: null,
      ideasMenu: `Revuelto de huevos con espinaca, tomate y cebolla con tostadas integrales.
Tofu grille con ensalada de rúcula, pepino, tomate cherry y semillas.
Sopa de lentejas con vegetales y pan integral.`,
    },
  })

  const g3_cena_hidratos = await prisma.templateGrupo.create({
    data: { comidaId: c3_cena.id, nombre: "Hidratos", orden: 1 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_cena_hidratos.id, texto: "SIN CARBOHIDRATOS POR LA NOCHE (salvo entrene a la tarde)", orden: 1 },
      { grupoId: g3_cena_hidratos.id, texto: "1 feta de pan integral (si hay entrenamiento vespertino)", orden: 2 },
    ],
  })

  const g3_cena_proteinas = await prisma.templateGrupo.create({
    data: { comidaId: c3_cena.id, nombre: "Proteínas", orden: 2 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_cena_proteinas.id, texto: "3 huevos (revuelto, tortilla, poché)", orden: 1 },
      { grupoId: g3_cena_proteinas.id, texto: "150gr de tofu grille o salteado", orden: 2 },
      { grupoId: g3_cena_proteinas.id, texto: "100gr de seitán", orden: 3 },
      { grupoId: g3_cena_proteinas.id, texto: "150gr de legumbres en cocido + 1 huevo", orden: 4 },
    ],
  })

  const g3_cena_vegetales = await prisma.templateGrupo.create({
    data: { comidaId: c3_cena.id, nombre: "Vegetales", orden: 3 },
  })
  await prisma.templateOpcion.create({
    data: { grupoId: g3_cena_vegetales.id, texto: "2 tazas crudas ó 1 taza en cocido: acelga, brócoli, coliflor, espinaca, lechuga, tomate, zapallito, espárrago, rúcula, pepino, berenjena", orden: 1 },
  })

  const g3_cena_grasas = await prisma.templateGrupo.create({
    data: { comidaId: c3_cena.id, nombre: "Grasas", orden: 4 },
  })
  await prisma.templateOpcion.createMany({
    data: [
      { grupoId: g3_cena_grasas.id, texto: "1 cdita de aceite de oliva o lino", orden: 1 },
      { grupoId: g3_cena_grasas.id, texto: "2 cdas de palta", orden: 2 },
      { grupoId: g3_cena_grasas.id, texto: "1 cda de semillas mixtas", orden: 3 },
    ],
  })

  console.log("✓ Template 3: Vegetariano")
  console.log("\n✅ Seed completado: 3 templates nutricionales insertados.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
