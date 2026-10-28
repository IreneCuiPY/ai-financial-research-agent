
export type RevenueRecord = {
  start: string;
  end: string;
  val: number;
  form: string;
  filed: string;
  fy?: number;
  fp?: string;
  frame?: string;
};

export type AnnualRevenue = {
  fiscalYear: number;
  start: string;
  end: string;
  revenue: number;
  filed: string;
};

function getPeriodDays(
  start: string,
  end: string
): number {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (
    (endDate.getTime() - startDate.getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

export function extractAnnualRevenue(
  records: RevenueRecord[]
): AnnualRevenue[] {
  // Step 1: Filter annual 10-K records
  const annual = records.filter((r) => {
    if (r.form !== "10-K") return false;

    const days = getPeriodDays(r.start, r.end);

    return days >= 350 && days <= 380;
  });

  // Step 2: Deduplicate by fiscal period
  const byPeriod = new Map<string, RevenueRecord>();

  for (const record of annual) {
    const key = `${record.start}_${record.end}`;
    const existing = byPeriod.get(key);

    if (!existing || record.filed > existing.filed) {
      byPeriod.set(key, record);
    }
  }

  // Step 3: Convert to annual revenue data
  return Array.from(byPeriod.values())
    .map((r) => ({
      fiscalYear: Number(r.end.slice(0, 4)),
      start: r.start,
      end: r.end,
      revenue: r.val,
      filed: r.filed,
    }))
    .sort((a, b) => a.end.localeCompare(b.end));
}

export function calculateRevenueGrowth(
  current: number,
  previous: number
): number {
  if (previous <= 0) {
    throw new Error("Previous revenue must be positive");
  }

  return (current - previous) / previous;
}
