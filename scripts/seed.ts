import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Role = "admin" | "member";
type PaymentStatus = "paid" | "pending";
type EnrollmentStatus = "active" | "cancelled";

type SeedUser = {
  email: string;
  fullName: string;
  role: Role;
};

type SeedBlueprint = {
  plans: { name: string; price: number; durationDays: number }[];
  users: SeedUser[];
  trainers: { fullName: string; specialty: string; bio: string }[];
  availability: { trainerEmailKey: string; dayOfWeek: number; startTime: string; endTime: string }[];
  classes: { name: string; description: string; trainerEmailKey: string; daysOffset: number; hour: number }[];
  memberships: { memberIndex: number; startDaysOffset: number; planName: string }[];
  payments: { memberIndex: number; amount: number; concept: string; status: PaymentStatus; daysOffset: number }[];
  enrollments: { classIndex: number; memberIndex: number; status: EnrollmentStatus }[];
};

function isoDate(base: Date, daysOffset: number): string {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

export function buildSeedBlueprint(now: Date): SeedBlueprint {
  const plans = [
    { name: "Plan Mensual", price: 799, durationDays: 30 },
    { name: "Plan Trimestral", price: 2099, durationDays: 90 },
    { name: "Plan Anual", price: 6999, durationDays: 365 },
  ];

  const users: SeedUser[] = [
    { email: "admin@gympower.demo", fullName: "Admin Gym Power", role: "admin" },
    { email: "member.demo@gympower.demo", fullName: "Miembro Demo", role: "member" },
    ...Array.from({ length: 35 }, (_, i) => ({
      email: `member${String(i + 1).padStart(2, "0")}@gympower.demo`,
      fullName: `Miembro ${i + 1}`,
      role: "member" as const,
    })),
  ];

  const trainers = [
    { fullName: "Sofia Rojas", specialty: "Cross Training", bio: "Entrenamiento funcional y fuerza." },
    { fullName: "Diego Campos", specialty: "HIIT", bio: "Rutinas de alta intensidad." },
    { fullName: "Fernanda Luna", specialty: "Yoga", bio: "Movilidad y recuperación activa." },
    { fullName: "Carlos Vega", specialty: "Box", bio: "Técnica y acondicionamiento." },
  ];

  const availability = [
    { trainerEmailKey: "Sofia Rojas", dayOfWeek: 1, startTime: "07:00", endTime: "10:00" },
    { trainerEmailKey: "Sofia Rojas", dayOfWeek: 3, startTime: "17:00", endTime: "20:00" },
    { trainerEmailKey: "Diego Campos", dayOfWeek: 2, startTime: "06:00", endTime: "09:00" },
    { trainerEmailKey: "Diego Campos", dayOfWeek: 4, startTime: "18:00", endTime: "21:00" },
    { trainerEmailKey: "Fernanda Luna", dayOfWeek: 1, startTime: "08:00", endTime: "11:00" },
    { trainerEmailKey: "Fernanda Luna", dayOfWeek: 5, startTime: "16:00", endTime: "19:00" },
    { trainerEmailKey: "Carlos Vega", dayOfWeek: 2, startTime: "19:00", endTime: "22:00" },
    { trainerEmailKey: "Carlos Vega", dayOfWeek: 6, startTime: "09:00", endTime: "12:00" },
  ];

  const classes = [
    { name: "Cross Morning", description: "[SEED] Clase de fuerza", trainerEmailKey: "Sofia Rojas", daysOffset: 1, hour: 7 },
    { name: "Cross Evening", description: "[SEED] Clase de fuerza", trainerEmailKey: "Sofia Rojas", daysOffset: 2, hour: 18 },
    { name: "HIIT Blast", description: "[SEED] Cardio intenso", trainerEmailKey: "Diego Campos", daysOffset: 1, hour: 6 },
    { name: "HIIT Sunset", description: "[SEED] Cardio intenso", trainerEmailKey: "Diego Campos", daysOffset: 3, hour: 19 },
    { name: "Yoga Flow", description: "[SEED] Flexibilidad y core", trainerEmailKey: "Fernanda Luna", daysOffset: 2, hour: 8 },
    { name: "Yoga Restore", description: "[SEED] Recuperacion", trainerEmailKey: "Fernanda Luna", daysOffset: 4, hour: 17 },
    { name: "Box Basics", description: "[SEED] Tecnica base", trainerEmailKey: "Carlos Vega", daysOffset: 2, hour: 20 },
    { name: "Box Conditioning", description: "[SEED] Acondicionamiento", trainerEmailKey: "Carlos Vega", daysOffset: 5, hour: 10 },
  ];

  // memberIndex 1 = member.demo, 2 = member01, …, 36 = member35
  // Membresías históricas distribuidas en 12 meses para poblar el dashboard analítico
  const memberships: SeedBlueprint["memberships"] = [
    // Abr 2025 (-365): 2 nuevos → Mensual (vence May 2025, baja)
    { memberIndex: 2,  startDaysOffset: -365, planName: "Plan Mensual" },
    { memberIndex: 3,  startDaysOffset: -362, planName: "Plan Mensual" },
    // May 2025 (-335): 2 nuevos → Trimestral (vence Ago 2025, baja)
    { memberIndex: 4,  startDaysOffset: -335, planName: "Plan Trimestral" },
    { memberIndex: 5,  startDaysOffset: -330, planName: "Plan Trimestral" },
    // Jun 2025 (-304): 3 nuevos → Mensual (vence Jul 2025, baja)
    { memberIndex: 6,  startDaysOffset: -304, planName: "Plan Mensual" },
    { memberIndex: 7,  startDaysOffset: -300, planName: "Plan Mensual" },
    { memberIndex: 8,  startDaysOffset: -295, planName: "Plan Mensual" },
    // Jul 2025 (-274): 2 nuevos → Trimestral (vence Oct 2025, baja)
    { memberIndex: 9,  startDaysOffset: -274, planName: "Plan Trimestral" },
    { memberIndex: 10, startDaysOffset: -270, planName: "Plan Trimestral" },
    // Ago 2025 (-243): 3 nuevos → mix
    { memberIndex: 11, startDaysOffset: -243, planName: "Plan Anual" },    // activo hasta Ago 2026
    { memberIndex: 12, startDaysOffset: -240, planName: "Plan Mensual" },  // baja Sep 2025
    { memberIndex: 13, startDaysOffset: -238, planName: "Plan Mensual" },  // baja Sep 2025
    // Sep 2025 (-213): 3 nuevos
    { memberIndex: 14, startDaysOffset: -213, planName: "Plan Anual" },    // activo hasta Sep 2026
    { memberIndex: 15, startDaysOffset: -210, planName: "Plan Anual" },    // activo hasta Sep 2026
    { memberIndex: 16, startDaysOffset: -208, planName: "Plan Mensual" },  // baja Oct 2025
    // Oct 2025 (-182): 2 nuevos → Trimestral (baja Ene 2026)
    { memberIndex: 17, startDaysOffset: -182, planName: "Plan Trimestral" },
    { memberIndex: 18, startDaysOffset: -178, planName: "Plan Trimestral" },
    // Nov 2025 (-152): 2 nuevos → Mensual (baja Dic 2025)
    { memberIndex: 19, startDaysOffset: -152, planName: "Plan Mensual" },
    { memberIndex: 20, startDaysOffset: -148, planName: "Plan Mensual" },
    // Dic 2025 (-121): 3 nuevos
    { memberIndex: 21, startDaysOffset: -121, planName: "Plan Anual" },    // activo hasta Dic 2026
    { memberIndex: 22, startDaysOffset: -118, planName: "Plan Anual" },    // activo hasta Dic 2026
    { memberIndex: 23, startDaysOffset: -115, planName: "Plan Mensual" },  // baja Ene 2026
    // Ene 2026 (-91): 3 nuevos
    { memberIndex: 24, startDaysOffset: -91, planName: "Plan Trimestral" }, // activo hasta Abr 2026
    { memberIndex: 25, startDaysOffset: -88, planName: "Plan Trimestral" }, // activo hasta Abr 2026
    { memberIndex: 26, startDaysOffset: -85, planName: "Plan Mensual" },    // baja Feb 2026
    // Feb 2026 (-60): 3 nuevos
    { memberIndex: 27, startDaysOffset: -60, planName: "Plan Mensual" },    // baja Mar 2026
    { memberIndex: 28, startDaysOffset: -57, planName: "Plan Mensual" },    // baja Mar 2026
    { memberIndex: 29, startDaysOffset: -55, planName: "Plan Trimestral" }, // activo hasta May 2026
    // Mar 2026 (-30): 4 nuevos
    { memberIndex: 30, startDaysOffset: -30, planName: "Plan Trimestral" }, // activo hasta Jun 2026
    { memberIndex: 31, startDaysOffset: -28, planName: "Plan Trimestral" }, // activo hasta Jun 2026
    { memberIndex: 32, startDaysOffset: -25, planName: "Plan Trimestral" }, // activo hasta Jun 2026
    { memberIndex: 33, startDaysOffset: -22, planName: "Plan Mensual" },    // activo hasta Abr 2026
    // Abr 2026 (últimos días): 4 nuevos
    { memberIndex: 1,  startDaysOffset: -8,  planName: "Plan Trimestral" }, // member.demo, activo
    { memberIndex: 34, startDaysOffset: -7,  planName: "Plan Mensual" },    // activo
    { memberIndex: 35, startDaysOffset: -5,  planName: "Plan Anual" },      // activo hasta Abr 2027
    { memberIndex: 36, startDaysOffset: -3,  planName: "Plan Mensual" },    // activo
  ];

  // Pagos distribuidos en 12 meses (para Finance dashboard)
  const payments: SeedBlueprint["payments"] = [
    // Abr-Jun 2025
    { memberIndex: 2,  amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -365 },
    { memberIndex: 3,  amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -362 },
    { memberIndex: 4,  amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -335 },
    { memberIndex: 5,  amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -330 },
    { memberIndex: 6,  amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -304 },
    { memberIndex: 7,  amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -300 },
    { memberIndex: 8,  amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -295 },
    // Jul-Sep 2025
    { memberIndex: 9,  amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -274 },
    { memberIndex: 10, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -270 },
    { memberIndex: 11, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -243 },
    { memberIndex: 12, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -240 },
    { memberIndex: 13, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -238 },
    { memberIndex: 14, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -213 },
    { memberIndex: 15, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -210 },
    { memberIndex: 16, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -208 },
    // Oct-Dic 2025
    { memberIndex: 17, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -182 },
    { memberIndex: 18, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -178 },
    { memberIndex: 19, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -152 },
    { memberIndex: 20, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -148 },
    { memberIndex: 21, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -121 },
    { memberIndex: 22, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -118 },
    { memberIndex: 23, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -115 },
    // Ene-Mar 2026
    { memberIndex: 24, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -91 },
    { memberIndex: 25, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -88 },
    { memberIndex: 26, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -85 },
    { memberIndex: 27, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -60 },
    { memberIndex: 28, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -57 },
    { memberIndex: 29, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -55 },
    { memberIndex: 30, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -30 },
    { memberIndex: 31, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -28 },
    { memberIndex: 32, amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -25 },
    { memberIndex: 33, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -22 },
    // Abr 2026 + pendientes
    { memberIndex: 1,  amount: 2099, concept: "[SEED] Plan Trimestral", status: "paid",    daysOffset: -8 },
    { memberIndex: 34, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -7 },
    { memberIndex: 35, amount: 6999, concept: "[SEED] Plan Anual",      status: "paid",    daysOffset: -5 },
    { memberIndex: 36, amount: 799,  concept: "[SEED] Plan Mensual",    status: "paid",    daysOffset: -3 },
    // Adeudos pendientes varios
    { memberIndex: 24, amount: 2099, concept: "[SEED] Renovación Trimestral", status: "pending", daysOffset: 5 },
    { memberIndex: 25, amount: 2099, concept: "[SEED] Renovación Trimestral", status: "pending", daysOffset: 8 },
    { memberIndex: 33, amount: 799,  concept: "[SEED] Renovación Mensual",    status: "pending", daysOffset: 10 },
  ];

  const enrollments = Array.from({ length: 30 }, (_, i) => ({
    classIndex: i % 8,
    memberIndex: (i % 35) + 1,
    status: i % 5 === 0 ? "cancelled" : "active" as EnrollmentStatus,
  }));

  void now;
  return { plans, users, trainers, availability, classes, memberships, payments, enrollments };
}

export async function runSeed() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator <= 0) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, serviceRole);
  const blueprint = buildSeedBlueprint(new Date());

  const seedEmails = blueprint.users.map((u) => u.email);
  const seedPlanNames = blueprint.plans.map((p) => p.name);
  const seedTrainerNames = blueprint.trainers.map((t) => t.fullName);

  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id,email")
    .in("email", seedEmails);

  const existingMemberIds = (existingProfiles ?? []).map((p) => p.id);

  if (existingMemberIds.length > 0) {
    await supabase.from("class_enrollments").delete().in("member_id", existingMemberIds);
    await supabase.from("member_memberships").delete().in("member_id", existingMemberIds);
    await supabase
      .from("payments")
      .delete()
      .or(`member_id.in.(${existingMemberIds.join(",")}),created_by.in.(${existingMemberIds.join(",")})`);
  }

  await supabase.from("classes").delete().like("description", "[SEED]%");
  await supabase.from("trainers").delete().in("full_name", seedTrainerNames);
  await supabase.from("membership_plans").delete().in("name", seedPlanNames);

  const { data: listedUsers } = await supabase.auth.admin.listUsers();
  for (const user of listedUsers.users) {
    if (user.email && seedEmails.includes(user.email)) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  for (const user of blueprint.users) {
    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: "Demo1234!",
      email_confirm: true,
      user_metadata: { full_name: user.fullName, role: user.role },
    });
    if (error) throw error;
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .in("email", seedEmails);
  if (profileError || !profiles) throw profileError ?? new Error("profiles not found");

  const profileByEmail = new Map(profiles.map((p) => [p.email, p.id]));
  const adminId = profileByEmail.get("admin@gympower.demo");
  if (!adminId) throw new Error("Admin profile not created");

  const { data: plans, error: planError } = await supabase
    .from("membership_plans")
    .insert(blueprint.plans.map((p) => ({ name: p.name, price: p.price, duration_days: p.durationDays })))
    .select("id,name,duration_days");
  if (planError || !plans) throw planError ?? new Error("Plans not inserted");
  const planByName = new Map(plans.map((p) => [p.name, { id: p.id, durationDays: p.duration_days }]));

  const { data: trainers, error: trainerError } = await supabase
    .from("trainers")
    .insert(blueprint.trainers.map((t) => ({ full_name: t.fullName, specialty: t.specialty, bio: t.bio })))
    .select("id,full_name");
  if (trainerError || !trainers) throw trainerError ?? new Error("Trainers not inserted");
  const trainerByName = new Map(trainers.map((t) => [t.full_name, t.id]));

  const availabilityRows = blueprint.availability.map((a) => ({
    trainer_id: trainerByName.get(a.trainerEmailKey),
    day_of_week: a.dayOfWeek,
    start_time: a.startTime,
    end_time: a.endTime,
  }));
  const { error: availabilityError } = await supabase.from("trainer_availability").insert(availabilityRows);
  if (availabilityError) throw availabilityError;

  const now = new Date();
  const classRows = blueprint.classes.map((c) => {
    const scheduled = new Date(now);
    scheduled.setUTCDate(scheduled.getUTCDate() + c.daysOffset);
    scheduled.setUTCHours(c.hour, 0, 0, 0);
    return {
      name: c.name,
      description: c.description,
      trainer_id: trainerByName.get(c.trainerEmailKey) ?? null,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: 60,
      max_capacity: 20,
    };
  });

  const { data: classes, error: classError } = await supabase
    .from("classes")
    .insert(classRows)
    .select("id,name");
  if (classError || !classes) throw classError ?? new Error("Classes not inserted");

  const memberEmails = blueprint.users.filter((u) => u.role === "member").map((u) => u.email);
  const memberIds = memberEmails.map((email) => profileByEmail.get(email)).filter(Boolean) as string[];

  // memberIndex 1-based: 1 = member.demo, 2 = member01, …
  const membershipRows = blueprint.memberships.map((m) => {
    const memberId = memberIds[(m.memberIndex - 1) % memberIds.length];
    const planMeta = planByName.get(m.planName);
    if (!planMeta) throw new Error(`Missing plan: ${m.planName}`);
    const start = isoDate(now, m.startDaysOffset);
    const end = isoDate(now, m.startDaysOffset + planMeta.durationDays);
    return {
      member_id: memberId,
      plan_id: planMeta.id,
      start_date: start,
      end_date: end,
    };
  });
  const { error: membershipsError } = await supabase.from("member_memberships").insert(membershipRows);
  if (membershipsError) throw membershipsError;

  const paymentRows = blueprint.payments.map((p) => {
    const memberId = memberIds[(p.memberIndex - 1) % memberIds.length];
    const date = isoDate(now, p.daysOffset);
    return {
      member_id: memberId,
      created_by: adminId,
      amount: p.amount,
      concept: p.concept,
      status: p.status,
      // paid → payment_date = date of payment; pending → due_date = due date
      payment_date: p.status === "paid" ? date : null,
      due_date: p.status === "pending" ? date : null,
    };
  });
  const { error: paymentError } = await supabase.from("payments").insert(paymentRows);
  if (paymentError) throw paymentError;

  const classIds = classes.map((c) => c.id);
  const activeSet = new Set<string>();
  const enrollmentRows = blueprint.enrollments
    .map((e) => {
      const classId = classIds[e.classIndex % classIds.length];
      const memberId = memberIds[(e.memberIndex - 1) % memberIds.length];
      const key = `${classId}:${memberId}`;
      if (e.status === "active") {
        if (activeSet.has(key)) return null;
        activeSet.add(key);
      }
      return { class_id: classId, member_id: memberId, status: e.status };
    })
    .filter(Boolean) as { class_id: string; member_id: string; status: EnrollmentStatus }[];
  const { error: enrollmentError } = await supabase.from("class_enrollments").insert(enrollmentRows);
  if (enrollmentError) throw enrollmentError;

  console.log("Seed completed.");
  console.log(`Plans: ${blueprint.plans.length}`);
  console.log(`Users: ${blueprint.users.length}`);
  console.log(`Trainers: ${blueprint.trainers.length}`);
  console.log(`Classes: ${blueprint.classes.length}`);
  console.log(`Payments: ${blueprint.payments.length}`);
}

if (!process.env.VITEST) {
  runSeed().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
