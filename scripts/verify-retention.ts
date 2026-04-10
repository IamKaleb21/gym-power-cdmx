/**
 * Carga `member_memberships` y muestra el desglose de retención 12M (CDMX).
 * Uso: pnpm tsx scripts/verify-retention.ts
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getRetentionBreakdown } from "../src/lib/analytics/utils";
import { getAdminAnalyticsRangeDates } from "../src/lib/dates/mexico-city";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole);
  const { data: rows, error } = await supabase
    .from("member_memberships")
    .select("member_id, start_date, end_date");

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const memberships = (rows ?? []).map((r) => ({
    member_id: r.member_id,
    start_date: typeof r.start_date === "string" ? r.start_date : String(r.start_date),
    end_date: typeof r.end_date === "string" ? r.end_date : String(r.end_date),
  }));

  const { startDate, endDate } = getAdminAnalyticsRangeDates("12m");
  const b = getRetentionBreakdown(memberships, startDate, endDate);

  console.log("--- Rango 12M (calendario CDMX) ---");
  console.log(`startDate: ${b.startDate}`);
  console.log(`endDate:   ${b.endDate} (hoy CDMX)`);
  console.log(`today:     ${b.today} (límite bajas)`);
  console.log("");
  console.log("--- Conteos (filas en member_memberships) ---");
  console.log(`activeAtStart (activos el día ${b.startDate}):     ${b.activeAtStart}`);
  console.log(`activeAtEnd (activos el día ${b.endDate}):         ${b.activeAtEnd}  ← KPI Activos`);
  console.log(`newCount (alta con start en [start,end]):         ${b.newCount}  ← KPI Nuevas altas`);
  console.log(`newMembershipsActiveAtEnd (altas en rango y aún vigentes al ${b.endDate}): ${b.newMembershipsActiveAtEnd}`);
  console.log(`churnCount (end_date en rango y < today):         ${b.churnCount}  ← KPI Bajas`);
  console.log("");
  console.log("--- Retención cohorte ---");
  console.log(`retainedCount = activeAtEnd - newMembershipsActiveAtEnd = ${b.activeAtEnd} - ${b.newMembershipsActiveAtEnd} = ${b.retainedCount}`);
  console.log(`retentionRate = (retainedCount / activeAtStart) * 100  →  (${b.retainedCount} / ${b.activeAtStart}) * 100 = ${b.retentionRate.toFixed(2)}%`);
  if (b.activeAtStart === 0) {
    console.log("\n(Nota: activeAtStart = 0 → la fórmula fuerza 0% para evitar división por cero.)");
  }
  if (b.retainedCount <= 0 && b.activeAtStart > 0) {
    console.log("\n(Nota: retainedCount ≤ 0 → nadie de la cohorte inicial queda como 'solo antiguo' al cierre; retención 0%.)");
  }
  console.log("");
  console.log(`Total filas membresía: ${memberships.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
