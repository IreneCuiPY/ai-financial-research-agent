import { describe, it, expect } from "vitest";
import { analyzeRevenueGrowth } from "../lib/insights";

describe("Financial Insights", () => {
  it("detects decelerating growth", () => {
    const result = analyzeRevenueGrowth([
      { fiscalYear: 2024, revenue: 60, growth: 1.25 },
      { fiscalYear: 2025, revenue: 130, growth: 1.14 },
      { fiscalYear: 2026, revenue: 216, growth: 0.65 },
    ]);

    expect(result?.status).toBe("decelerating");
    expect(result?.changePercentagePoints).toBeCloseTo(-49);
  });

  it("detects accelerating growth", () => {
    const result = analyzeRevenueGrowth([
      { fiscalYear: 2024, revenue: 100, growth: 0.1 },
      { fiscalYear: 2025, revenue: 120, growth: 0.2 },
    ]);

    expect(result?.status).toBe("accelerating");
  });

  it("detects stable growth", () => {
    const result = analyzeRevenueGrowth([
      { fiscalYear: 2024, revenue: 100, growth: 0.1 },
      { fiscalYear: 2025, revenue: 110, growth: 0.105 },
    ]);

    expect(result?.status).toBe("stable");
  });

  it("returns null for insufficient data", () => {
    const result = analyzeRevenueGrowth([
      { fiscalYear: 2025, revenue: 100, growth: null },
    ]);

    expect(result).toBeNull();
  });
});
