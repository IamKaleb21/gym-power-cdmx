import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GYM POWER CDMX | The Kinetic Monolith",
  description:
    "Mexico City's definitive third space for elite performance and recovery.",
};

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
                href="#"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Classes
              </a>
              <a
                className="text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-80"
                href="#"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Trainers
              </a>
              <a
                className="text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-80"
                href="#"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Experience
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
                placeholder="EXPLORE..."
                type="text"
                style={{ fontFamily: "Space Grotesk" }}
              />
            </div>
            <button
              className="bg-[#cafd00] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4a5e00] transition-all hover:scale-95 active:scale-90"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Member Login
            </button>
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
                The Kinetic Monolith
              </span>
            </div>
            <h1
              className="mb-8 text-6xl leading-[0.85] font-black uppercase tracking-tighter text-white md:text-9xl"
              style={{ fontFamily: "Space Grotesk" }}
            >
              UNLEASH <br /> <span className="italic text-[#cafd00]">RAW POWER</span>
            </h1>
            <p className="mb-10 max-w-xl border-l-2 border-[#cafd00] pl-6 text-lg leading-relaxed text-[#e5e2e1] md:text-xl">
              Mexico City&apos;s definitive third space. Where high-velocity elite
              performance meets brutalist precision. This is not a gym. This is a
              sanctuary for the obsessed.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                className="group flex items-center justify-between bg-[#cafd00] px-10 py-5 text-lg font-black uppercase tracking-tighter text-[#0e0e0e] transition-all hover:bg-[#f3ffca]"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Join the Tribe
                <span className="material-symbols-outlined ml-4 transition-transform group-hover:translate-x-2">
                  arrow_forward
                </span>
              </button>
              <button
                className="border border-white/20 px-10 py-5 text-lg font-black uppercase tracking-tighter text-white transition-all hover:bg-white hover:text-black"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Explore Experience
              </button>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-50">
            <span className="vertical-text text-[10px] font-black uppercase tracking-widest">
              Scroll
            </span>
            <div className="relative h-12 w-px overflow-hidden bg-white/30">
              <div className="absolute top-0 left-0 h-1/2 w-full animate-pulse bg-[#cafd00]" />
            </div>
          </div>
        </section>

        <section className="bg-[#0e0e0e] px-6 py-24 md:px-20">
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
                  The Third Space
                </h2>
                <p className="max-w-md text-[#e5e2e1]">
                  Beyond work and home, we provide the architectural foundation for
                  your transformation. A community of elite mindset and physical
                  mastery.
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
                Precision Recovery
              </h3>
              <p className="mt-4 text-center font-medium">
                Cryotherapy, Infrared Saunas, and Hyperbaric chambers designed for
                the 1%.
              </p>
              <button className="mt-8 border-b-2 border-[#4a5e00] pb-1 text-xs font-black uppercase tracking-widest transition-all hover:opacity-70">
                Book Session
              </button>
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
                  Elite Arsenal
                </h3>
                <p className="text-sm text-[#adaaaa]">
                  Hand-picked equipment from across the globe. Calibrated for
                  maximum hypertrophy.
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
                  The Tribe
                </h3>
                <p className="mt-2 max-w-sm text-[#e5e2e1]">
                  Access exclusive networking events, metabolic workshops, and
                  performance seminars.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-black py-24">
          <div className="mb-12 flex items-end justify-between px-6 md:px-20">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-[#cafd00]">
                Live Sessions
              </span>
              <h2
                className="mt-2 text-6xl font-black uppercase text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Class Previews
              </h2>
            </div>
            <a
              className="border-b-2 border-[#cafd00] pb-1 font-black uppercase tracking-widest text-[#cafd00] transition-all hover:border-white hover:text-white"
              href="#"
              style={{ fontFamily: "Space Grotesk" }}
            >
              View All Classes
            </a>
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
                  Live Now
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    60 MIN • High Intensity
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
                  METABOLIC PEAK
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  The ultimate fat-burning protocol. Designed to spike your heart
                  rate and push your VO2 Max.
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
                  Starts in 20m
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    75 MIN • Mobility
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
                  ZEN ARCHITECTURE
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  Dynamic structural mobility focusing on spinal decompression and
                  nervous system regulation.
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
                  Full Capacity
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
              </div>
              <div className="p-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#adaaaa]">
                    50 MIN • Combat
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
                  STRIKE LAB
                </h3>
                <p className="mt-2 text-sm text-[#adaaaa]">
                  Technical boxing meets high-power anaerobic conditioning.
                  Sharpen your edge.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#cafd00] py-32">
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-10">
            <div
              className="translate-x-[-10%] translate-y-[20%] -rotate-12 text-[20rem] leading-none font-black uppercase text-[#4a5e00]"
              style={{ fontFamily: "Space Grotesk" }}
            >
              POWER
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-between gap-12 px-6 md:flex-row md:px-20">
            <div className="max-w-2xl">
              <h2
                className="mb-8 text-7xl leading-[0.9] font-black uppercase text-[#4a5e00] md:text-8xl"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Ready to <br /> Evolve?
              </h2>
              <p className="mb-8 text-xl leading-relaxed font-medium text-[#4a5e00]/80">
                Stop exercising. Start training. Join the collective of
                high-performers in the heart of CDMX.
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
                    All Access Pass
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
                    Precision Biometrics
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
                    Guest Lounge Access
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full bg-[#0e0e0e] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] md:w-[400px]">
              <h3
                className="text-center text-3xl font-black uppercase text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Elite Tier
              </h3>
              <div className="text-center">
                <span className="text-5xl font-black text-[#cafd00]">$2,499</span>
                <span className="text-sm text-[#adaaaa]">/ MXN MONTH</span>
              </div>
              <div className="space-y-4 border-y border-white/10 py-6">
                <p className="flex items-center justify-between text-sm font-medium text-white">
                  Unlimited HIIT &amp; Yoga
                  <span className="material-symbols-outlined text-[#cafd00]">
                    done
                  </span>
                </p>
                <p className="flex items-center justify-between text-sm font-medium text-white">
                  Personal Training Intro
                  <span className="material-symbols-outlined text-[#cafd00]">
                    done
                  </span>
                </p>
                <p className="flex items-center justify-between text-sm font-medium text-white">
                  Sauna &amp; Cold Plunge
                  <span className="material-symbols-outlined text-[#cafd00]">
                    done
                  </span>
                </p>
              </div>
              <button
                className="w-full bg-[#cafd00] py-4 font-black uppercase tracking-widest text-[#4a5e00] transition-all hover:scale-[1.02]"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Claim Membership
              </button>
              <p className="text-center text-[10px] uppercase tracking-widest text-[#adaaaa]">
                Limited slots available for Q3
              </p>
            </div>
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
                Mexico City&apos;s premium destination for physical and mental peak
                performance.
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
                Navigation
              </h4>
              <ul className="space-y-3">
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    The Space
                  </a>
                </li>
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    Performance Arsenal
                  </a>
                </li>
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    Pricing Tiers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="mb-6 font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Support
              </h4>
              <ul className="space-y-3">
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    Member Portal
                  </a>
                </li>
                <li>
                  <a className="text-xs uppercase tracking-widest text-[#adaaaa] transition-colors hover:text-[#cafd00]" href="#">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className="mb-6 font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Location
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
                  Open 24/7 Elite Access
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between border-t border-white/5 pt-10 md:flex-row">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#adaaaa]">
              © 2024 GYM POWER MEXICO CITY. NO EXCUSES.
            </span>
            <span
              className="mt-4 text-[10px] font-black uppercase italic tracking-[0.2em] text-white md:mt-0"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Built for the Obsessed
            </span>
          </div>
        </footer>

        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-[#0e0e0e]/80 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] backdrop-blur-lg md:hidden">
          <div className="flex flex-col items-center justify-center py-2 text-[10px] uppercase tracking-widest text-gray-400 opacity-50">
            <span className="material-symbols-outlined">person</span>
            <span className="mt-1">Profile</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-sm bg-[#262626] px-6 py-2 text-[10px] uppercase tracking-widest text-[#cafd00]">
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="mt-1">Classes</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 text-[10px] uppercase tracking-widest text-gray-400 opacity-50">
            <span className="material-symbols-outlined">qr_code</span>
            <span className="mt-1">Access</span>
          </div>
        </nav>
      </div>
    </>
  );
}
