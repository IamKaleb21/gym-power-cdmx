const DAY_LABELS: Record<number, string> = {
  0: "DOM",
  1: "LUN",
  2: "MAR",
  3: "MIÉ",
  4: "JUE",
  5: "VIE",
  6: "SÁB",
};

type SlotRow = { day_of_week: number; start_time: string; end_time: string };
type DisplayChip = { day: string; range: string };

/** Convierte Set<"day-hour"> → rows con rangos fusionados (end_time es exclusivo) */
export function compressSlots(selected: Set<string>): SlotRow[] {
  const byDay = new Map<number, number[]>();
  for (const key of selected) {
    const [d, h] = key.split("-").map(Number);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(h);
  }

  const result: SlotRow[] = [];
  for (const [day, hours] of byDay) {
    const sorted = [...hours].sort((a, b) => a - b);
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        result.push({
          day_of_week: day,
          start_time: `${String(start).padStart(2, "0")}:00`,
          end_time: `${String(prev + 1).padStart(2, "0")}:00`,
        });
        start = curr;
        prev = curr;
      }
    }
  }

  return result;
}

/** Expande rows DB → Set<"day-hour"> para pre-llenar el grid */
export function expandSlots(rows: SlotRow[]): Set<string> {
  const result = new Set<string>();
  for (const row of rows) {
    const startH = parseInt(row.start_time.slice(0, 2), 10);
    const endH = parseInt(row.end_time.slice(0, 2), 10);
    for (let h = startH; h < endH; h++) {
      result.add(`${row.day_of_week}-${h}`);
    }
  }
  return result;
}

/** Convierte rows DB → chips de display {day, range} */
export function compressForDisplay(rows: SlotRow[]): DisplayChip[] {
  return rows.map((row) => ({
    day: DAY_LABELS[row.day_of_week] ?? `D${row.day_of_week}`,
    range: `${row.start_time.slice(0, 2)}-${row.end_time.slice(0, 2)}`,
  }));
}
