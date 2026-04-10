import type { UserRole } from "./routing";

type LoginFailure = {
  ok: false;
  message: string;
};

type LoginSuccess = {
  ok: true;
  role: UserRole;
};

type LoginInput = LoginFailure | LoginSuccess;

type LoginResult =
  | { ok: false; error: string }
  | { ok: true; redirectTo: "/admin/dashboard" | "/member/dashboard" };

export function getLoginResult(input: LoginInput): LoginResult {
  if (!input.ok) {
    return { ok: false, error: input.message };
  }

  if (input.role === "admin") {
    return { ok: true, redirectTo: "/admin/dashboard" };
  }

  return { ok: true, redirectTo: "/member/dashboard" };
}
