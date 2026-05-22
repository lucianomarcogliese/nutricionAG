@AGENTS.md

# Proyecto: Claude Nutri

App de nutrición y entrenamiento personalizado. Pacientes ven su plan, nutricionistas/admins los gestionan desde un panel.

## Stack

- **Next.js 16** — App Router, Turbopack, React Server Components
- **Prisma 7** con adaptador `PrismaPg` (Neon/PostgreSQL)
- **NextAuth v4** — JWT sessions, `getServerSession(authOptions)`
- **Tailwind CSS** — paleta principal: `emerald`; nunca `green` salvo en badges de "vegetariano"
- **Pusher** — mensajería en tiempo real (`src/lib/pusher.ts` server, `src/lib/pusher-client.ts` client)
- **Cloudinary** — upload de imágenes (`src/lib/cloudinary.ts`)

## Prisma — reglas críticas

**Después de cualquier `prisma migrate dev`, siempre correr `prisma generate` y reiniciar el servidor.** El singleton en memoria queda con el cliente viejo y las queries fallan silenciosamente o con errores crípticos.

El cliente se instancia con el adaptador `PrismaPg`:

```ts
// src/lib/prisma.ts — único import correcto
import { prisma } from "@/lib/prisma"
```

Para scripts fuera de Next.js (seeds, etc.) hay que instanciar igual con `PrismaPg` + `dotenv`. Ver `scripts/seed-templates.ts` como referencia.

El output del cliente generado está en `src/generated/prisma` (no en `node_modules`). Importar enums desde `@/generated/prisma/enums`.

**Transacciones con muchas queries (deep copies, full replace):** el timeout default de Prisma `$transaction` es 5 segundos y la latencia a Neon es alta. Siempre pasar `{ timeout: 30000 }`:
```ts
await prisma.$transaction(async (tx) => { ... }, { timeout: 30000 })
```

## Autenticación y roles

```ts
const session = await getServerSession(authOptions)
const role = (session?.user as { role?: string })?.role
```

Roles: `USER` · `ADMIN` · `NUTRICIONISTA` · `RECEPCIONISTA`

- Lectura de datos de pacientes: `ADMIN | NUTRICIONISTA`
- Escritura de templates/planes: `ADMIN | NUTRICIONISTA`
- Eliminar templates: solo `ADMIN`
- Mutations sensibles (roles, seeds): solo `ADMIN`

## Estructura de rutas

```
src/app/
  page.tsx                  → landing
  dashboard/                → app del paciente (sidebar con tabs)
  admin/                    → panel admin (AdminDashboard con nav lateral)
  api/
    admin/…                 → endpoints protegidos por rol (admin/nutricionista)
    nutricion/mi-plan       → plan del paciente autenticado (solo lectura)
    perfil/…, peso/…, etc.  → endpoints del paciente
```

## Schema — modelos principales

**Dos sistemas de nutrición coexisten — no mezclarlos:**

| Sistema | Modelos | Uso |
|---------|---------|-----|
| Legado | `NutritionPlan → Meal → FoodItem` | No tocar |
| Nuevo | `TemplatePlan` → copia → `PlanNutricional` | Sistema activo |

**Flujo del sistema nuevo:**
1. Nutricionista crea/edita `TemplatePlan` (con `TemplateComida → TemplateGrupo → TemplateOpcion`)
2. Admin/nutricionista asigna template a paciente → deep copy independiente → `PlanNutricional` (con `PlanComida → PlanGrupo → PlanOpcion`)
3. `fromTemplateId String?` en `PlanNutricional` es informativo, no FK
4. Editar el plan de un paciente **nunca** afecta el template original

**Profile:** puede no existir cuando el User se registra. Las API que necesitan `profileId` deben usar `profile.upsert` en lugar de `profile.findUnique` para no explotar.

**Suscripciones y permisos:** `Subscription.plan` (string: `"GRATIS"`, `"PRO"`, `"PREMIUM"`) → `PlanConfig.permisos` (JSON). Usar `getPermisos(userId)` de `src/lib/permisos.ts`.

## Convenciones de API

- Validar sesión + rol al inicio de cada handler
- Errores: `NextResponse.json({ error: "mensaje" }, { status: 4xx | 5xx })`
- Éxito en POST con creación: status `201`
- Params de ruta dinámica son Promise en Next.js 16: `const { id } = await params`
- Loggear errores del servidor: `console.error("ruta error:", error instanceof Error ? error.message : error)`

## Componentes clave

- `src/components/admin/AdminDashboard.tsx` — nav lateral, agrega tabs aquí
- `src/components/admin/users/UserDetailModal.tsx` — drawer lateral de usuario, tiene tabs Perfil / Entrenamiento / Nutrición
- `src/components/admin/users/UserNutricionNuevoTab.tsx` — gestión de plan nutricional desde admin
- `src/components/admin/tabs/TemplatesNutricionalesTab.tsx` — CRUD de templates
- `src/components/nutricion/NutricionView.tsx` — vista del paciente (solo lectura)

## Comandos útiles

```bash
npx prisma migrate dev --name descripcion   # nueva migración
npx prisma generate                          # regenerar cliente (obligatorio tras migrate)
npx tsx scripts/seed-templates.ts           # sembrar templates de ejemplo
npm run dev                                  # servidor en :3000
```
