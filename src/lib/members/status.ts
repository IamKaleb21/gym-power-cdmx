export type MemberStatus = "active" | "expiring_soon" | "expired";

export function getMemberStatus(endDate: string): MemberStatus {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  const threshold = new Date(today);
  threshold.setUTCDate(today.getUTCDate() + 7);

  if (end < today) return "expired";
  if (end <= threshold) return "expiring_soon";
  return "active";
}

export function formatDaysRemaining(endDate: string): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  const diff = Math.round(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff < 0) return "Vencida";
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Queda 1 día";
  return `Quedan ${diff} días`;
}
