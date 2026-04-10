import { z } from "zod";

export const createTrainerSchema = z.object({
  full_name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  specialty: z.string().min(1, "Especialidad requerida"),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const updateTrainerSchema = createTrainerSchema.partial();

export const availabilitySlotSchema = z
  .object({
    trainer_id: z.string().uuid(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((s) => s.end_time > s.start_time, {
    message: "end_time debe ser mayor que start_time",
  });

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerInput = z.infer<typeof updateTrainerSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
