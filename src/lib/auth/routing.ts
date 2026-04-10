export type UserRole = "admin" | "member";

type RouteDecision =
  | { allow: true }
  | {
      allow: false;
      redirectTo: string;
    };

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function isMemberPath(pathname: string): boolean {
  return pathname.startsWith("/member");
}

export function resolveProtectedRoute(
  pathname: string,
  role: UserRole | null,
): RouteDecision {
  if (!isAdminPath(pathname) && !isMemberPath(pathname)) {
    return { allow: true };
  }

  if (!role) {
    return { allow: false, redirectTo: "/login" };
  }

  if (isAdminPath(pathname) && role === "member") {
    return { allow: false, redirectTo: "/member/dashboard" };
  }

  if (isMemberPath(pathname) && role === "admin") {
    return { allow: false, redirectTo: "/admin/dashboard" };
  }

  return { allow: true };
}
