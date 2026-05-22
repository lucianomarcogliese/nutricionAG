import { z } from 'zod'

const TIPOS = ['CONSULTA_NUTRICIONAL', 'SEGUIMIENTO', 'ANTROPOMETRIA', 'CONSULTA_DEPORTIVA'] as const

export const appointmentSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  nutricionistaId: z.string().min(1, 'nutricionistaId es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.enum(TIPOS, { message: 'Tipo de turno inválido' }),
  duracion: z.number().int().positive('La duración debe ser positiva').optional().default(60),
  notas: z.string().nullable().optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
