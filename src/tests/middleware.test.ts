import { describe, expect, it } from "vitest";
import { resolveProtectedRoute } from "@/lib/auth/routing";

describe("resolveProtectedRoute", () => {
  it("redirects to /login when no session in protected routes", () => {
    expect(resolveProtectedRoute("/admin/dashboard", null)).toEqual({
      allow: false,
      redirectTo: "/login",
    });
    expect(resolveProtectedRoute("/member/dashboard", null)).toEqual({
      allow: false,
      redirectTo: "/login",
    });
  });

  it("prevents members from accessing /admin routes", () => {
    expect(resolveProtectedRoute("/admin/dashboard", "member")).toEqual({
      allow: false,
      redirectTo: "/member/dashboard",
    });
  });

  it("allows admin in admin routes", () => {
    expect(resolveProtectedRoute("/admin/dashboard", "admin")).toEqual({
      allow: true,
    });
  });

  it("prevents admin from accessing member routes", () => {
    expect(resolveProtectedRoute("/member/dashboard", "admin")).toEqual({
      allow: false,
      redirectTo: "/admin/dashboard",
    });
  });
});
