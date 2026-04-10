import { z } from 'zod'

function isFutureIso(val: string): boolean {
  return new Date(val).getTime() > Date.now()
}

export const createClassSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  trainer_id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.union([z.string().uuid(), z.null()]),
  ),
  scheduled_at: z
    .string()
    .min(1, 'Fecha y hora requeridas')
    .refine(isFutureIso, { message: 'La clase debe programarse en el futuro' }),
  duration_minutes: z.coerce.number().int().positive().default(60),
  max_capacity: z.coerce.number().int().positive('Capacidad debe ser mayor a 0'),
})

/** Updates: no exigimos `scheduled_at` en el futuro (ediciones de clases ya creadas). */
export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  trainer_id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.union([z.string().uuid(), z.null()]).optional(),
  ),
  scheduled_at: z.string().min(1).optional(),
  duration_minutes: z.coerce.number().int().positive().optional(),
  max_capacity: z.coerce.number().int().positive().optional(),
})

export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
