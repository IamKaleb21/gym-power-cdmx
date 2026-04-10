import { type NextRequest, NextResponse } from "next/server";
import { resolveProtectedRoute, type UserRole } from "@/lib/auth/routing";
import { createClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin" || profile?.role === "member") {
      role = profile.role;
    }
  }

  const decision = resolveProtectedRoute(request.nextUrl.pathname, role);

  if (!decision.allow) {
    const url = request.nextUrl.clone();
    url.pathname = decision.redirectTo;
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/login" && role) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/member/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*", "/login"],
};
