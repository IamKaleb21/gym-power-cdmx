import { describe, it, expect } from "vitest";
import { createTrainerSchema, availabilitySlotSchema } from "@/lib/validations/trainer.schema";
import { compressSlots, expandSlots, compressForDisplay } from "@/lib/trainers/availability";

describe("createTrainerSchema", () => {
  it("valida full_name requerido (min 2)", () => {
    expect(createTrainerSchema.safeParse({ full_name: "A", specialty: "HIIT" }).success).toBe(false);
    expect(createTrainerSchema.safeParse({ full_name: "", specialty: "HIIT" }).success).toBe(false);
  });

  it("valida specialty requerido", () => {
    expect(createTrainerSchema.safeParse({ full_name: "Ana López", specialty: "" }).success).toBe(false);
  });

  it("acepta entrada válida", () => {
    expect(createTrainerSchema.safeParse({ full_name: "Ana López", specialty: "HIIT" }).success).toBe(true);
  });
});

const TRAINER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("availabilitySlotSchema", () => {
  it("rechaza end_time <= start_time", () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: TRAINER_ID,
      day_of_week: 1,
      start_time: "12:00",
      end_time: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza day_of_week fuera de 0-6", () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: TRAINER_ID,
      day_of_week: 7,
      start_time: "06:00",
      end_time: "12:00",
    });
    expect(result.success).toBe(false);
  });

  it("acepta slot válido", () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: TRAINER_ID,
      day_of_week: 1,
      start_time: "06:00",
      end_time: "12:00",
    });
    expect(result.success).toBe(true);
  });
});

describe("compressSlots", () => {
  it("celdas consecutivas mismo día → un rango", () => {
    const selected = new Set(["1-6", "1-7", "1-8"]);
    const result = compressSlots(selected);
    expect(result).toEqual([{ day_of_week: 1, start_time: "06:00", end_time: "09:00" }]);
  });

  it("celdas no consecutivas → rangos separados", () => {
    const selected = new Set(["1-6", "1-7", "1-10", "1-11"]);
    const result = compressSlots(selected);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ day_of_week: 1, start_time: "06:00", end_time: "08:00" });
    expect(result[1]).toEqual({ day_of_week: 1, start_time: "10:00", end_time: "12:00" });
  });

  it("días distintos → rangos independientes", () => {
    const selected = new Set(["1-6", "1-7", "3-14", "3-15"]);
    const result = compressSlots(selected);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.day_of_week === 1)).toEqual({
      day_of_week: 1,
      start_time: "06:00",
      end_time: "08:00",
    });
    expect(result.find((r) => r.day_of_week === 3)).toEqual({
      day_of_week: 3,
      start_time: "14:00",
      end_time: "16:00",
    });
  });

  it("Set vacío → array vacío", () => {
    expect(compressSlots(new Set())).toEqual([]);
  });
});

describe("expandSlots", () => {
  it("rows DB → Set<\"day-hour\"> correcto", () => {
    const rows = [{ day_of_week: 1, start_time: "06:00", end_time: "08:00" }];
    const result = expandSlots(rows);
    expect(result.has("1-6")).toBe(true);
    expect(result.has("1-7")).toBe(true);
    expect(result.has("1-8")).toBe(false); // end_time es exclusivo
  });
});

describe("compressForDisplay", () => {
  it("rows DB → chips {day, range}", () => {
    const rows = [
      { day_of_week: 1, start_time: "06:00", end_time: "12:00" },
      { day_of_week: 6, start_time: "08:00", end_time: "14:00" },
    ];
    const chips = compressForDisplay(rows);
    expect(chips).toContainEqual({ day: "LUN", range: "06-12" });
    expect(chips).toContainEqual({ day: "SÁB", range: "08-14" });
  });
});
