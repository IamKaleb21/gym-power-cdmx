import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gym Power CDMX | Entrenamiento y clases en Ciudad de México",
  description:
    "Gimnasio en CDMX: planes de membresía, clases grupales y seguimiento para miembros y staff.",
};

type LandingPlan = {
  name: string;
  price: number;
  durationDays: number;
  blurb: string;
  perks: readonly string[];
  featured?: boolean;
};

/** Catálogo alineado con `buildSeedBlueprint` en scripts/seed.ts */
const MEMBERSHIP_PLANS: LandingPlan[] = [
  {
    name: "Plan Mensual",
    price: 799,
    durationDays: 30,
    blurb: "Ideal para probar el ambiente y mantener rutina sin compromiso largo.",
    perks: ["Acceso al gimnasio", "Clases grupales incluidas", "App miembro y QR de acceso"],
  },
  {
    name: "Plan Trimestral",
    price: 2099,
    durationDays: 90,
    blurb: "Mejor relación precio por mes; perfecto para ciclos de 3 meses.",
    perks: ["Todo lo del mensual", "Ahorro vs. 3× mensual", "Prioridad en cupos de clase"],
    featured: true,
  },
  {
    name: "Plan Anual",
    price: 6999,
    durationDays: 365,
    blurb: "Máximo ahorro para quien entrena todo el año.",
    perks: ["Todo lo anterior", "Mejor precio por día", "Enfoque en constancia anual"],
  },
];

export default function Home() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .landing-root {
          background-color: #0e0e0e;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }
        .glass-panel {
          background: rgba(14, 14, 14, 0.7);
          backdrop-filter: blur(20px);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .vertical-text {
          writing-mode: vertical-rl;
        }
      `}</style>
      <div className="landing-root">
        <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#484847]/15 bg-[#0e0e0e]/70 px-6 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center gap-8">
            <span
              className="text-xl font-black uppercase italic tracking-tighter text-[#f3ffca]"
              style={{ fontFamily: "Space Grotesk" }}
            >
              GYM POWER CDMX
            </span>
            <div className="hidden items-center gap-6 md:flex">
              <a
                className="text-xs font-bold uppercase tracking-widest text-[#cafd00] transition-all hover:opacity-80"
                href="#clases"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Clases
              </a>
              <a
                className="text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-80"
                href="#entrenadores"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Entrenadores
              </a>
              <a
                className="text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-80"
                href="#experiencia"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Experiencia
              </a>
              <a
                className="text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-80"
                href="#planes"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Planes
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="group relative hidden md:flex">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#767575]">
                search
              </span>
              <input
                className="w-48 bg-[#262626] py-1.5 pr-4 pl-10 text-[10px] tracking-widest placeholder:text-[#767575] focus:ring-1 focus:ring-[#cafd00]"
                placeholder="BUSCAR…"
                type="search"
                style={{ fontFamily: "Space Grotesk" }}
              />
            </div>
            <Link
              href="/login"
              className="bg-[#cafd00] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4a5e00] transition-all hover:scale-95 active:scale-90"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Iniciar sesión
            </Link>
            <div className="flex gap-2">
              <span className="material-symbols-outlined cursor-pointer text-white transition-colors hover:text-[#cafd00]">
                notifications
              </span>
              <span className="material-symbols-outlined cursor-pointer text-white transition-colors hover:text-[#cafd00]">
                settings
              </span>
            </div>
          </div>
        </nav>

        <section className="relative flex h-screen w-full items-center justify-start overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <img
              alt="high-contrast low-key photography of a muscular athlete in a dark industrial gym setting with dramatic neon lime accent lighting"
              className="h-full w-full scale-110 object-cover opacity-50 grayscale contrast-125"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8mAXV_h4BqbIOdtkFYqFtpu9UuualvflTEe9o-FVDlJVvOOYEc-aIGhOuukB7ZntRqRzJoube-S6u23YFsfmWq8XxpMmbARxontTI0GuwpuJpzVpISyXFtvyZeiu-j2cYbfxuUiiAT-HuP2rJbDyA0qBlSMN_z1Z_DTVABUB8cb5SV-1KHPcQiW2crcLiYh3PifHb8zjiI9OtxtOXDQsyvWWeaIJe8G1H4tOqqE5910RxmV21boS-Dbmx-RwSv3aT_uch53_yZKFS"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent" />
          </div>
          <div className="relative z-10 max-w-5xl px-6 md:px-20">
            <div className="mb-2">
              <span className="bg-[#f3ffca] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#516700]">
                CDMX · Alto rendimiento
              </span>
            </div>
            <h1
              className="mb-8 text-6xl leading-[0.85] font-black uppercase tracking-tighter text-white md:text-9xl"
              style={{ fontFamily: "Space Grotesk" }}
            >
              DESATA <br />{" "}
              <span className="italic text-[#cafd00]">PODER PURO</span>
            </h1>
            <p className="mb-10 max-w-xl border-l-2 border-[#cafd00] pl-6 text-lg leading-relaxed text-[#e5e2e1] md:text-xl">
              Tu espacio en la Ciudad de México para entrenar en serio: equipamiento
              de primer nivel, clases grupales guiadas y membresías claras. Aquí no
              solo &quot;vas al gym&quot;: construyes constancia.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#planes"
                className="group flex items-center justify-between bg-[#cafd00] px-10 py-5 text-lg font-black uppercase tracking-tighter text-[#0e0e0e] transition-all hover:bg-[#f3ffca]"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Ver planes
                <span className="material-symbols-outlined ml-4 transition-transform group-hover:translate-x-2">
                  arrow_forward
                </span>
              </a>
              <a
                href="#experiencia"
                className="border border-white/20 px-10 py-5 text-lg font-black uppercase tracking-tighter text-white transition-all hover:bg-white hover:text-black"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Conocer la experiencia
              </a>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-50">
            <span className="vertical-text text-[10px] font-black uppercase tracking-widest">
              Desliza
            </span>
            <div className="relative h-12 w-px overflow-hidden bg-white/30">
              <div className="absolute top-0 left-0 h-1/2 w-full animate-pulse bg-[#cafd00]" />
            </div>
          </div>
        </section>

        <section
          id="experiencia"
          className="bg-[#0e0e0e] px-6 py-24 md:px-20"
        >
          <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-12">
            <div className="group relative flex min-h-[400px] flex-col justify-end overflow-hidden bg-[#131313] p-12 md:col-span-8">
              <img
                alt="architectural interior shot of a high-end brutalist gym with raw concrete walls and sleek modern lighting equipment"
                className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARStwFkuMQ5xExZFOEUtQpagmIkDA6D35Ak6flSdwIDTpOd7c-iOyuPnV6AiALYuQ8XEtviGq8qf4bhtYkw8-N4tVdjqNoFHRizgwnwHAnsht3y_r97w6WjezFyEeEpSiMUQPbU8BZQMVcE3KmdZ8FCUsQ2ZTtIeFSd45z2eFCWcQseJ-MDZiyKu2sH4MbayQE7jHKqFKjVREa0XP4i4_QxjCqlqECK-r3dMigtEn7XlWurbPFsgQJhiH_DdMmd7J6xH24RtgWQoHF"
              />
              <div className="relative z-10">
                <h2
                  className="mb-4 text-5xl font-black uppercase text-[#cafd00]"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  El tercer espacio
                </h2>
                <p className="max-w-md text-[#e5e2e1]">
                  Entre el trabajo y el hogar: un lugar diseñado para tu
                  transformación física y mental, con comunidad y estándares claros.
                </p>
              </div>
            </div>
            <div className="flex min-h-[400px] flex-col items-center justify-center bg-[#cafd00] p-8 text-[#4a5e00] md:col-span-4">
              <span
                className="select-none text-8xl font-black opacity-20"
                style={{ fontFamily: "Space Grotesk" }}
              >
                01
              </span>
              <h3
                className="mt-[-40px] text-center text-3xl font-black uppercase"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Recuperación
              </h3>
              <p className="mt-4 text-center font-medium">
                Zonas de descanso y protocolos para bajar la carga y volver al piso
                con energía.
              </p>
              <a
                href="#planes"
                className="mt-8 inline-block border-b-2 border-[#4a5e00] pb-1 text-xs font-black uppercase tracking-widest transition-all hover:opacity-70"
              >
                Ver membresías
              </a>
            </div>
            <div className="group flex flex-col justify-between bg-[#262626] p-12 md:col-span-4">
              <span
                className="material-symbols-outlined text-5xl text-[#cafd00]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                fitness_center
              </span>
              <div>
                <h3
                  className="mb-2 text-2xl font-black uppercase text-white"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  Equipo de élite
                </h3>
                <p className="text-sm text-[#adaaaa]">
                  Máquinas y peso libre seleccionados para fuerza, hipertrofia y
                  acondicionamiento.
                </p>
              </div>
            </div>
            <div className="group relative min-h-[300px] overflow-hidden bg-[#131313] md:col-span-8">
              <img
                alt="candid lifestyle shot of athletic members interacting in a high-end social lounge of a luxury gym in Mexico City"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrSNPe3VegrM4VKOjfmO5D5-lL15qV4CotrH-_MK76ImxvzazMYkZurW8-1errYg5_kr9xgG89zRABPiKiQ7w2snq6wQaMJ6mZVok9wz1kpZCY5E3fnO8naA3R7GEdKzhNguGTNLs_m43pvNiysv2Psu0ci1SOHWSw-9r5K_kbkBc9hnoC3ndxh4k6SxtlUc7qxPswZ2gpoEKLQaxIhX8fC5HvR6sru5rkV0W23dGKaBHFWBED5rZbvMMgF-2_zoFW0lJv8kyVQ75Y"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-12">
                <h3
                  className="text-3xl font-black uppercase text-white"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  La tribu
                </h3>
                <p className="mt-2 max-w-sm text-[#e5e2e1]">
                  Talleres, retos y una comunidad que empuja en la misma dirección.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="clases" className="overflow-hidden bg-black py-24 scroll-mt-20">
          <div className="px-6 pb-6 md:px-20">
            <p
              id="entrenadores"
              className="max-w-2xl scroll-mt-24 text-sm leading-relaxed text-[#adaaaa]"
            >
              Entrenadores en sala: Cross Training, HIIT, yoga y box. Clases
              grupales para todos los niveles.
            </p>
          </div>
          <div className="mb-12 flex items-end justify-between px-6 md:px-20">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-[#cafd00]">
                En vivo
              </span>
              <h2
                className="mt-2 text-6xl font-black uppercase text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Muestra de clases
              </h2>
            </div>
            <Link
              href="/login"
              className="border-b-2 border-[#cafd00] pb-1 font-black uppercase tracking-widest text-[#cafd00] transition-all hover:border-white hover:text-white"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Reservar en la app
            </Link>
          </div>
          <div className="no-scrollbar flex gap-6 overflow-x-auto px-6 pb-12 md:px-20">
            <div className="group w-[350px] shrink-0 bg-[#131313]">
              <div className="relative h-[450px] overflow-hidden">
                <img
                  alt="intense HIIT class with athletes in motion, blurred lights and sweating faces in a dark studio"
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDX_4i1eDb8aJhk_SQRUWhZW70hHvu05wzZ7DE3nW_HqIplENzJcee851cTiGtIBShfwpA4-_L3QIT83rUOIvrqb1U-rqcZxqgvOx4fknos94S75qgxqYzQLiIYBQaWCeIO8dEpvwDaNvG8yXEnX4yATJiFVo-jXO3BZdxr7AHKtsp-v-g9iqSC_s1Zg1Mb9ZTm8uC4wkQbU8FIPIWNnphGU3q5JDgt0HT-XgMwhgfr-df2LBIfFuICeL_NsVzuMI6ThSwMTWAmbUS"
                />
                <div className="absolute top-4 left-4 bg-[#f3ffca] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#516700]">
                  En curso
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    60 MIN · Alta intensidad
                  </span>
                  <span
                    className="material-symbols-outlined text-sm text-[#cafd00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    bolt
                  </span>
                </div>
                <h3
                  className="text-2xl font-black uppercase text-white transition-colors group-hover:text-[#cafd00]"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  Pico metabólico
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  HIIT para quemar calorías y subir el ritmo cardíaco con
                  seguridad.
                </p>
              </div>
            </div>
            <div className="group w-[350px] shrink-0 bg-[#131313]">
              <div className="relative h-[450px] overflow-hidden">
                <img
                  alt="serene and dark yoga studio with subtle lime green backlighting, person in advanced pose on a mat"
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8WI03jBa3HN3ZNM7N-OfXxUhOjDNN2a538k7wExk4HECqVAYIuPfvBUkdhRFm5j9cFjQEMkT0LrQykIDry48DTVidOmj6DZEIcRFADf0u6k2Qk7GoFHXGIAv1i5YWxm6-HmWx5RW3PRCZndpQsb84yakXjgD4sHI_Mg_zbirZjvbuxjpMJ-uyOLo7PDzguZUsmkxp-TjGlIck7OJ3WnxJdRNFwOO3cdJcBid9SqKvIBVndSjYsdlV0TebmQIT0mbL4s20B-g47XaY"
                />
                <div className="absolute top-4 left-4 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                  En 20 min
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    75 MIN · Movilidad
                  </span>
                  <span
                    className="material-symbols-outlined text-sm text-[#cafd00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    self_improvement
                  </span>
                </div>
                <h3
                  className="text-2xl font-black uppercase text-white transition-colors group-hover:text-[#cafd00]"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  Arquitectura zen
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  Yoga y movilidad para columna, core y regulación del sistema
                  nervioso.
                </p>
              </div>
            </div>
            <div className="group w-[350px] shrink-0 bg-[#131313]">
              <div className="relative h-[450px] overflow-hidden">
                <img
                  alt="heavy boxing bag in a dark industrial gym setting with steam and low-key lighting"
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXxh8LBSBWmOAglfPGyuASS4UFnJn0y7pzaVfKOEB1Jkips9LwGSDJfCJwLip4d6bhKR-ZcTDOTfdrsRTU9OO_F9neMDq4Uhr5NjkHv1-VRwUT7jwLC7zze4b7xNdn6MOrfSBqfC2FIWW1UBmLxpvsVUk_c07PqoERM4yjLedY5LuNBHaFF3DpzfFE5lUXaZFIraRj6ZMCMa2nQ03p9pNS8PdJqlPIaLIu3uLhgayBeHUlT3fzHDNNXXjKpgLJjx4u7v_wJrBSqrh8"
                />
                <div className="absolute top-4 left-4 bg-[#f3ffca] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#516700]">
                  Cupo lleno
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    50 MIN · Combate
                  </span>
                  <span
                    className="material-symbols-outlined text-sm text-[#cafd00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    sports_kabaddi
                  </span>
                </div>
                <h3
                  className="text-2xl font-black uppercase text-white transition-colors group-hover:text-[#cafd00]"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  Laboratorio de golpes
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  Box y acondicionamiento anaeróbico para técnica y resistencia.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="planes"
          className="relative scroll-mt-20 overflow-hidden bg-[#cafd00] py-32"
        >
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-10">
            <div
              className="translate-x-[-10%] translate-y-[20%] -rotate-12 text-[20rem] leading-none font-black uppercase text-[#4a5e00]"
              style={{ fontFamily: "Space Grotesk" }}
            >
              POWER
            </div>
          </div>
          <div className="relative z-10 flex flex-col gap-12 px-6 md:px-20">
            <div className="max-w-3xl">
              <h2
                className="mb-6 text-5xl leading-[0.9] font-black uppercase text-[#4a5e00] md:text-7xl"
                style={{ fontFamily: "Space Grotesk" }}
              >
                ¿Listo para <br /> dar el siguiente paso?
              </h2>
              <p className="mb-6 text-lg leading-relaxed font-medium text-[#4a5e00]/90 md:text-xl">
                Membresías reales del catálogo Gym Power CDMX (mismos montos que
                verás en el panel admin). El alta la gestiona el equipo en
                recepción; tú entras con tu cuenta para reservar y escanear tu
                QR.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-full bg-[#4a5e00]/10 px-4 py-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#4a5e00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4a5e00]">
                    Acceso + clases grupales
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#4a5e00]/10 px-4 py-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#4a5e00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4a5e00]">
                    Portal miembro y QR
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#4a5e00]/10 px-4 py-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#4a5e00]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4a5e00]">
                    Precios en MXN IVA incluido
                  </span>
                </div>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
              {MEMBERSHIP_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col bg-[#0e0e0e] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
                    plan.featured
                      ? "ring-2 ring-[#cafd00] ring-offset-4 ring-offset-[#cafd00] md:scale-[1.02]"
                      : ""
                  }`}
                >
                  {plan.featured ? (
                    <span className="mb-3 inline-block w-fit bg-[#cafd00] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#4a5e00]">
                      Más elegido
                    </span>
                  ) : null}
                  <h3
                    className="text-2xl font-black uppercase text-white"
                    style={{ fontFamily: "Space Grotesk" }}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#adaaaa]">{plan.blurb}</p>
                  <div className="mt-6 text-center">
                    <span className="text-4xl font-black text-[#cafd00] md:text-5xl">
                      $
                      {plan.price.toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="mt-1 block text-xs font-medium uppercase tracking-widest text-[#adaaaa]">
                      MXN · vigencia {plan.durationDays} días
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 border-y border-white/10 py-6">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start justify-between gap-2 text-sm font-medium text-white"
                      >
                        <span>{perk}</span>
                        <span className="material-symbols-outlined shrink-0 text-[#cafd00] text-lg">
                          done
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className="mt-6 block w-full bg-[#cafd00] py-4 text-center font-black uppercase tracking-widest text-[#4a5e00] transition-all hover:scale-[1.02]"
                    style={{ fontFamily: "Space Grotesk" }}
                  >
                    Iniciar sesión
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] font-medium uppercase tracking-widest text-[#4a5e00]/80">
              Contratación en recepción · Demo técnica: credenciales en README o
              seed
            </p>
          </div>
        </section>

        <footer className="bg-black px-6 pt-20 pb-10 md:px-20">
          <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-4">
            <div className="md:col-span-1">
              <span
                className="text-2xl font-black uppercase italic text-[#cafd00]"
                style={{ fontFamily: "Space Grotesk" }}
              >
                GYM POWER
              </span>
              <p className="mt-6 max-w-xs text-xs leading-relaxed text-[#adaaaa]">
                Gimnasio premium en CDMX: fuerza, clases grupales y seguimiento
                digital para miembros.
              </p>
              <div className="mt-8 flex gap-4">
                <span className="material-symbols-outlined cursor-pointer text-white hover:text-[#cafd00]">
                  public
                </span>
                <span className="material-symbols-outlined cursor-pointer text-white hover:text-[#cafd00]">
                  chat
                </span>
                <span className="material-symbols-outlined cursor-pointer text-white hover:text-[#cafd00]">
                  camera
                </span>
              </div>
            </div>
            <div>
              <h4
                className="mb-6 font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Navegación
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]"
                    href="#experiencia"
                  >
                    El espacio
                  </a>
                </li>
                <li>
                  <a
                    className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]"
                    href="#clases"
                  >
                    Clases
                  </a>
                </li>
                <li>
                  <a
                    className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]"
                    href="#planes"
                  >
                    Planes
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="mb-6 font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Soporte
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]"
                    href="mailto:hola@gympower.demo"
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]"
                  >
                    Portal miembros
                  </Link>
                </li>
                <li>
                  <span className="text-xs uppercase tracking-widest text-[#adaaaa] opacity-60">
                    Aviso de privacidad
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="mb-6 font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Ubicación
              </h4>
              <p className="text-xs leading-relaxed uppercase tracking-widest text-[#adaaaa]">
                Av. Paseo de la Reforma 296,
                <br />
                Juárez, Cuauhtémoc,
                <br />
                06600 Ciudad de México, CDMX
              </p>
              <div className="mt-4 flex items-center gap-2 text-[#cafd00]">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Horario ampliado · acceso miembros
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between border-t border-white/5 pt-10 md:flex-row">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#adaaaa]">
              © {new Date().getFullYear()} Gym Power CDMX. Sin excusas.
            </span>
            <span
              className="mt-4 text-[10px] font-black uppercase italic tracking-[0.2em] text-white md:mt-0"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Hecho para quienes entrenan en serio
            </span>
          </div>
        </footer>

        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-[#0e0e0e]/80 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] backdrop-blur-lg md:hidden">
          <Link
            href="/login"
            className="flex flex-col items-center justify-center py-2 text-[10px] uppercase tracking-widest text-[#cafd00]"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="mt-1">Entrar</span>
          </Link>
          <a
            href="#clases"
            className="flex flex-col items-center justify-center rounded-sm bg-[#262626] px-6 py-2 text-[10px] uppercase tracking-widest text-[#cafd00]"
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="mt-1">Clases</span>
          </a>
          <Link
            href="/login"
            className="flex flex-col items-center justify-center py-2 text-[10px] uppercase tracking-widest text-gray-400"
          >
            <span className="material-symbols-outlined">qr_code</span>
            <span className="mt-1">Mi QR</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
