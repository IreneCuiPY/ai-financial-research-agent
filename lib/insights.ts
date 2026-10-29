export type GrowthPoint = {
  fiscalYear: number;
  revenue: number;
  growth: number | null;
};

export type GrowthInsight = {
  status: "accelerating" | "decelerating" | "stable";
  currentGrowth: number;
  previousGrowth: number;
  changePercentagePoints: number;
  summary: string;
};

export function analyzeRevenueGrowth(
  history: GrowthPoint[]
): GrowthInsight | null {
  const valid = history
    .filter(
      (point): point is GrowthPoint & { growth: number } =>
        point.growth !== null && Number.isFinite(point.growth)
    )
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  if (valid.length < 2) {
    return null;
  }

  const current = valid[valid.length - 1];
  const previous = valid[valid.length - 2];

  const changePercentagePoints =
    (current.growth - previous.growth) * 100;

  const threshold = 1;

  let status: GrowthInsight["status"];

  if (changePercentagePoints > threshold) {
    status = "accelerating";
  } else if (changePercentagePoints < -threshold) {
    status = "decelerating";
  } else {
    status = "stable";
  }

  const currentGrowth = current.growth * 100;
  const previousGrowth = previous.growth * 100;

  const direction =
    status === "accelerating"
      ? "accelerated"
      : status === "decelerating"
        ? "decelerated"
        : "remained relatively stable";

  const summary =
    `Revenue growth ${direction} from ` +
    `${previousGrowth.toFixed(2)}% in FY${previous.fiscalYear} ` +
    `to ${currentGrowth.toFixed(2)}% in FY${current.fiscalYear}. ` +
    `The change was ${changePercentagePoints.toFixed(2)} percentage points.`;

  return {
    status,
    currentGrowth,
    previousGrowth,
    changePercentagePoints,
    summary,
  };
}
