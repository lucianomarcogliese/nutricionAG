import { z } from 'zod'

export const nutricionPlanSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  caloriesTarget: z
    .union([z.number().int().min(0, 'Debe ser mayor o igual a 0').max(10000, 'Máximo 10000 kcal'), z.null()])
    .optional(),
})

export type NutricionPlanInput = z.infer<typeof nutricionPlanSchema>
