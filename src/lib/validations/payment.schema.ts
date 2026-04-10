import { z } from 'zod'

export const registerPaymentSchema = z
  .object({
    member_id: z.string().uuid('Miembro requerido'),
    amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
    concept: z.string().min(1, 'El concepto es requerido'),
    status: z.enum(['paid', 'pending']),
    payment_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === 'pending' && !data.due_date) return false
      return true
    },
    {
      message: 'La fecha de vencimiento es requerida para pagos pendientes',
      path: ['due_date'],
    },
  )

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>
