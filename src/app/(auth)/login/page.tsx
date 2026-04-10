"use client";

import { Inter, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getLoginResult } from "@/lib/auth/login";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName === "email" || fieldName === "password") {
          form.setError(fieldName, { message: issue.message });
        }
      }
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError || !data.user) {
      const result = getLoginResult({
        ok: false,
        message: signInError?.message ?? "No se pudo iniciar sesión",
      });
      if (!result.ok) {
        setApiError(result.error);
      }
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile || (profile.role !== "admin" && profile.role !== "member")) {
      setApiError("No se pudo identificar el rol del usuario");
      return;
    }

    const result = getLoginResult({ ok: true, role: profile.role });
    if (result.ok) {
      router.push(result.redirectTo);
      router.refresh();
    }
  });

  return (
    <div className={`${inter.className} min-h-screen bg-[#0e0e0e] text-white`}>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#0e0e0e] px-6 py-4">
        <div
          className={`${spaceGrotesk.className} text-2xl font-black tracking-tighter text-[#cafd00]`}
          style={{ letterSpacing: "-0.04em" }}
        >
          GYM POWER CDMX
        </div>
        <div className="hidden gap-8 md:flex">
          <span className={`${spaceGrotesk.className} text-xs uppercase tracking-widest text-[#262626]`}>
            Membership
          </span>
          <span className={`${spaceGrotesk.className} text-xs uppercase tracking-widest text-[#262626]`}>
            Locations
          </span>
          <span className={`${spaceGrotesk.className} text-xs uppercase tracking-widest text-[#262626]`}>
            Performance
          </span>
        </div>
        <button className={`${spaceGrotesk.className} font-bold uppercase tracking-tight text-[#cafd00] hover:text-[#f3ffca]`}>
          Support
        </button>
      </header>

      <main
        className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,14,14,0.8), rgba(14,14,14,0.95)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuB_zdaGZFHRsbyvv3KuL7oRxZSOavI8H7LVqsUz4HFraK514JjYyOSl9OQmXQjgGmM--v1lsCm7N3JIDwQZ5EYRj8xpAT2vFzu86Akgp70QP9wIuaktZJPdUmUps0jf6rAQuLcsGcQalqQCaF0njw72hzPydNYIKVWMqIC0ZGSMxwBvWD2dKQqI_2WDgyTuvJxzIhICrxbCadhL3eXPBgjnTJ68QFTOOI4o6otm_jWayS8ZZ8ts6duCbrYxlXG2fC1P_EyKFH4emg6p)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 select-none opacity-5">
          <h2 className={`${spaceGrotesk.className} text-[20rem] leading-none font-black italic`}>POWER</h2>
        </div>

        <div className="relative z-10 mt-16 w-full max-w-md px-6 py-12">
          <div className="border-l-4 border-[#cafd00] bg-[#131313]/70 p-8 shadow-2xl backdrop-blur-md lg:p-12">
            <div className="mb-10">
              <h1
                className={`${spaceGrotesk.className} mb-2 text-5xl leading-tight font-extrabold uppercase`}
                style={{ letterSpacing: "-0.04em" }}
              >
                Log <span className="italic text-[#cafd00]">In</span>
              </h1>
              <p className="text-xs uppercase tracking-widest text-[#adaaaa]">Access the kinetic monolith</p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label className="block px-1 text-[10px] font-bold uppercase tracking-widest text-[#cafd00]/60">
                  Email Terminal
                </label>
                <input
                  type="email"
                  placeholder="demo@gympowercdmx.mx"
                  className="w-full border-b-2 border-transparent bg-[#262626] py-4 pr-4 pl-4 text-white placeholder:text-[#767575] transition-all focus:border-[#cafd00] focus:bg-[#20201f] focus:outline-none"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block px-1 text-[10px] font-bold uppercase tracking-widest text-[#cafd00]/60">
                  Security Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border-b-2 border-transparent bg-[#262626] py-4 pr-4 pl-4 text-white placeholder:text-[#767575] transition-all focus:border-[#cafd00] focus:bg-[#20201f] focus:outline-none"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded-none bg-[#262626]" />
                  <span className="uppercase tracking-tight text-[#adaaaa] transition-colors group-hover:text-white">
                    Remember Session
                  </span>
                </label>
                <a
                  href="#"
                  className="uppercase tracking-tight text-[#adaaaa] underline decoration-[#cafd00]/30 underline-offset-4 transition-colors hover:text-[#cafd00]"
                >
                  Forgot Password?
                </a>
              </div>

              {apiError && <p className="text-sm text-red-400">{apiError}</p>}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={`${spaceGrotesk.className} flex w-full items-center justify-center gap-3 bg-[#cafd00] py-5 text-xl font-black uppercase tracking-tight text-[#3a4a00] transition-all hover:bg-[#f3ffca] active:scale-[0.98] disabled:opacity-60`}
              >
                {form.formState.isSubmitting ? "Ingresando..." : "LOGIN"}
                <span>→</span>
              </button>
            </form>

            <div className="mt-8 border-t border-[#484847]/20 pt-8">
              <p className="mb-4 text-center text-xs uppercase tracking-widest text-[#adaaaa]">
                New Performance Athlete?
              </p>
              <button
                className={`${spaceGrotesk.className} w-full border border-[#484847] bg-transparent py-4 font-bold uppercase tracking-tight text-white transition-all hover:bg-[#262626]`}
              >
                Request Membership
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-[#131313]/50 p-4 backdrop-blur">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#cafd00]/40">
                Admin Access
              </div>
              <div className="break-all font-mono text-[10px] text-[#adaaaa]">demo@gympowercdmx.mx</div>
            </div>
            <div className="bg-[#131313]/50 p-4 backdrop-blur">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#cafd00]/40">
                Member Access
              </div>
              <div className="break-all font-mono text-[10px] text-[#adaaaa]">miembro@gympowercdmx.mx</div>
            </div>
          </div>
        </div>

        <div className="absolute right-12 bottom-12 hidden rotate-90 lg:block">
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-[#cafd00]" />
            <span className={`${spaceGrotesk.className} text-sm uppercase`} style={{ letterSpacing: "0.5em" }}>
              Built for Power
            </span>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between bg-[#0e0e0e] px-12 py-6 text-[10px] uppercase tracking-[0.2em] text-[#767575]">
        <div>© 2024 GYM POWER CDMX</div>
        <div className="flex gap-6">
          <a className="transition-colors hover:text-[#cafd00]" href="#">
            Privacy
          </a>
          <a className="transition-colors hover:text-[#cafd00]" href="#">
            Terms
          </a>
          <a className="transition-colors hover:text-[#cafd00]" href="#">
            System Status: Active
          </a>
        </div>
      </footer>
    </div>
  );
}
