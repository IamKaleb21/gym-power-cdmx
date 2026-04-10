import { describe, expect, it } from "vitest";
import { getLoginResult } from "@/lib/auth/login";

describe("getLoginResult", () => {
  it("returns an error for invalid credentials", () => {
    expect(getLoginResult({ ok: false, message: "Invalid login credentials" })).toEqual({
      ok: false,
      error: "Invalid login credentials",
    });
  });

  it("redirects admins to /admin/dashboard", () => {
    expect(getLoginResult({ ok: true, role: "admin" })).toEqual({
      ok: true,
      redirectTo: "/admin/dashboard",
    });
  });

  it("redirects members to /member/dashboard", () => {
    expect(getLoginResult({ ok: true, role: "member" })).toEqual({
      ok: true,
      redirectTo: "/member/dashboard",
    });
  });
});
