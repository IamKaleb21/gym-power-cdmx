import { describe, it, expect } from "vitest";
import { getMemberStatus } from "@/lib/members/status";
import { createMemberSchema } from "@/lib/validations/member.schema";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function dateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("getMemberStatus", () => {
  it("returns active when end_date is 30 days away", () => {
    expect(getMemberStatus(dateOffset(30))).toBe("active");
  });

  it("returns expiring_soon when end_date is exactly 7 days away", () => {
    expect(getMemberStatus(dateOffset(7))).toBe("expiring_soon");
  });

  it("returns expiring_soon when end_date is 3 days away", () => {
    expect(getMemberStatus(dateOffset(3))).toBe("expiring_soon");
  });

  it("returns expired when end_date is yesterday", () => {
    expect(getMemberStatus(dateOffset(-1))).toBe("expired");
  });

  it("returns expiring_soon when end_date is today", () => {
    expect(getMemberStatus(dateOffset(0))).toBe("expiring_soon");
  });
});

describe("createMemberSchema", () => {
  const valid = {
    full_name: "Juan Pérez",
    email: "juan@example.com",
    temp_password: "Secreta123",
    plan_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    start_date: "2026-04-10",
  };

  it("passes with valid data", () => {
    expect(createMemberSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when full_name is missing", () => {
    const { full_name, ...rest } = valid;
    expect(createMemberSchema.safeParse(rest).success).toBe(false);
  });

  it("fails when email is invalid", () => {
    expect(createMemberSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("fails when temp_password has fewer than 8 chars", () => {
    expect(createMemberSchema.safeParse({ ...valid, temp_password: "short" }).success).toBe(false);
  });

  it("fails when plan_id is not a UUID", () => {
    expect(createMemberSchema.safeParse({ ...valid, plan_id: "not-a-uuid" }).success).toBe(false);
  });

  it("allows optional phone", () => {
    expect(createMemberSchema.safeParse({ ...valid, phone: "+52 55 1234 5678" }).success).toBe(true);
  });
});

describe("member detail query", () => {
  it("disambiguates payments relationship using member_id foreign key", () => {
    const pagePath = join(
      process.cwd(),
      "src/app/(admin)/admin/members/[id]/page.tsx",
    );
    const content = readFileSync(pagePath, "utf8");

    expect(content).toContain("payments!payments_member_id_fkey");
  });
});
