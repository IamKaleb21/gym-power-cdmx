import { describe, expect, it } from "vitest";
import { buildSeedBlueprint } from "./seed";

describe("buildSeedBlueprint", () => {
  it("builds required seed counts and status mixes", () => {
    const blueprint = buildSeedBlueprint(new Date("2026-01-15T10:00:00.000Z"));

    expect(blueprint.plans).toHaveLength(3);
    expect(blueprint.users).toHaveLength(12);
    expect(blueprint.users.filter((u) => u.role === "admin")).toHaveLength(1);
    expect(blueprint.users.filter((u) => u.role === "member")).toHaveLength(11);

    expect(blueprint.trainers).toHaveLength(4);
    expect(blueprint.availability).toHaveLength(8);
    expect(blueprint.classes).toHaveLength(8);
    expect(blueprint.payments).toHaveLength(20);
    expect(blueprint.enrollments.length).toBeGreaterThanOrEqual(16);

    const paymentStatuses = new Set(blueprint.payments.map((p) => p.status));
    expect(paymentStatuses.has("paid")).toBe(true);
    expect(paymentStatuses.has("pending")).toBe(true);

    const enrollmentStatuses = new Set(blueprint.enrollments.map((e) => e.status));
    expect(enrollmentStatuses.has("active")).toBe(true);
    expect(enrollmentStatuses.has("cancelled")).toBe(true);
  });
});
