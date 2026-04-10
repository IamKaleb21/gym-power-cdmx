import { createClient } from "@supabase/supabase-js";

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
    ...Array.from({ length: 10 }, (_, i) => ({
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

  const payments = Array.from({ length: 20 }, (_, i) => ({
    memberIndex: (i % 11) + 1,
    amount: 500 + (i % 4) * 150,
    concept: `[SEED] Pago ${i + 1}`,
    status: i % 3 === 0 ? "pending" : "paid" as PaymentStatus,
    daysOffset: -20 + i,
  }));

  const enrollments = Array.from({ length: 20 }, (_, i) => ({
    classIndex: i % 8,
    memberIndex: (i % 11) + 1,
    status: i % 5 === 0 ? "cancelled" : "active" as EnrollmentStatus,
  }));

  void now;
  return { plans, users, trainers, availability, classes, payments, enrollments };
}

export async function runSeed() {
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

  const membershipRows = memberIds.map((memberId, index) => {
    const plan = blueprint.plans[index % blueprint.plans.length];
    const planMeta = planByName.get(plan.name);
    if (!planMeta) throw new Error(`Missing plan ${plan.name}`);
    const start = isoDate(now, -5 * (index % 4));
    const end = isoDate(now, planMeta.durationDays - 5 * (index % 4));
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
