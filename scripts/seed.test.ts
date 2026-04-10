import { describe, expect, it } from "vitest";
import { buildSeedBlueprint } from "./seed";

describe("buildSeedBlueprint", () => {
  it("builds required seed counts and status mixes", () => {
    const blueprint = buildSeedBlueprint(new Date("2026-01-15T10:00:00.000Z"));

    expect(blueprint.plans).toHaveLength(3);
    // 1 admin + 1 member.demo + 35 numbered members = 37
    expect(blueprint.users).toHaveLength(37);
    expect(blueprint.users.filter((u) => u.role === "admin")).toHaveLength(1);
    expect(blueprint.users.filter((u) => u.role === "member")).toHaveLength(36);

    expect(blueprint.trainers).toHaveLength(4);
    expect(blueprint.availability).toHaveLength(8);
    expect(blueprint.classes).toHaveLength(8);
    // 36 historical memberships spanning 12 months
    expect(blueprint.memberships.length).toBeGreaterThanOrEqual(36);
    // 36 paid + 3 pending = 39 payments
    expect(blueprint.payments.length).toBeGreaterThanOrEqual(36);
    expect(blueprint.enrollments.length).toBeGreaterThanOrEqual(20);

    const paymentStatuses = new Set(blueprint.payments.map((p) => p.status));
    expect(paymentStatuses.has("paid")).toBe(true);
    expect(paymentStatuses.has("pending")).toBe(true);

    const enrollmentStatuses = new Set(blueprint.enrollments.map((e) => e.status));
    expect(enrollmentStatuses.has("active")).toBe(true);
    expect(enrollmentStatuses.has("cancelled")).toBe(true);
  });
});
