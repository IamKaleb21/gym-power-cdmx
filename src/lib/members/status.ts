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
