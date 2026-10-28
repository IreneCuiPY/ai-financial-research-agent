import { describe, it, expect } from "vitest";

import {
  extractAnnualRevenue,
  calculateRevenueGrowth,
  type RevenueRecord,
} from "../lib/revenue";

describe("Revenue Parser", () => {
  const records: RevenueRecord[] = [
    {
      start: "2023-10-01",
      end: "2024-09-28",
      val: 391035000000,
      form: "10-K",
      filed: "2024-11-01",
    },
    {
      start: "2023-10-01",
      end: "2024-09-28",
      val: 391035000000,
      form: "10-K",
      filed: "2025-10-31",
    },
    {
      start: "2024-09-29",
      end: "2025-09-27",
      val: 416161000000,
      form: "10-K",
      filed: "2025-10-31",
    },
  ];

  it("extracts annual revenue records", () => {
    const result = extractAnnualRevenue(records);

    expect(result).toHaveLength(2);
    expect(result[0].fiscalYear).toBe(2024);
    expect(result[1].fiscalYear).toBe(2025);
  });

  it("deduplicates repeated fiscal periods", () => {
    const result = extractAnnualRevenue(records);

    expect(result[0].revenue).toBe(391035000000);
    expect(result[0].filed).toBe("2025-10-31");
  });

  it("calculates YoY revenue growth", () => {
    const growth = calculateRevenueGrowth(
      416161000000,
      391035000000
    );

    expect(growth).toBeCloseTo(0.064255, 5);
  });

  it("rejects invalid previous revenue", () => {
    expect(() =>
      calculateRevenueGrowth(100, 0)
    ).toThrow("Previous revenue must be positive");
  });

  it("filters out quarterly revenue", () => {
    const quarterly: RevenueRecord = {
      start: "2025-06-29",
      end: "2025-09-27",
      val: 100000000000,
      form: "10-Q",
      filed: "2025-10-31",
    };

    const result = extractAnnualRevenue([
      ...records,
      quarterly,
    ]);

    expect(result).toHaveLength(2);
  });
});