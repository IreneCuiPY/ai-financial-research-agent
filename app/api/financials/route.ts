
import { NextResponse } from "next/server";
import { getCompanyFacts } from "@/lib/sec";
import {
  extractAnnualRevenue,
  calculateRevenueGrowth,
  type RevenueRecord,
} from "@/lib/revenue";

export async function GET() {
  try {
    // Step 1: Fetch Apple's SEC data
    const data = await getCompanyFacts(320193);

    // Step 2: Find the revenue metric
    const metric =
      data.facts["us-gaap"][
        "RevenueFromContractWithCustomerExcludingAssessedTax"
      ] as {
        units: {
          USD: RevenueRecord[];
        };
      } | undefined;

    if (!metric?.units?.USD) {
      return NextResponse.json(
        { error: "Revenue data unavailable" },
        { status: 404 }
      );
    }

    // Step 3: Extract annual revenue
    const annual = extractAnnualRevenue(metric.units.USD);

    if (annual.length < 2) {
      return NextResponse.json(
        { error: "Insufficient annual data" },
        { status: 422 }
      );
    }

    // Step 4: Calculate YoY growth
    const current = annual[annual.length - 1];
    const previous = annual[annual.length - 2];

    const revenueGrowth = calculateRevenueGrowth(
      current.revenue,
      previous.revenue
    );

    // Step 5: Return structured results
    return NextResponse.json({
      company: data.entityName,
      cik: data.cik,
      fiscalYear: current.fiscalYear,
      revenue: current.revenue,
      previousRevenue: previous.revenue,
      revenueGrowth,
      currency: "USD",
      source: "SEC EDGAR",
      periodEnd: current.end,
      filed: current.filed,
    });
  } catch (error) {
    console.error("Financial analytics error:", error);

    return NextResponse.json(
      { error: "Unable to calculate financial metrics" },
      { status: 500 }
    );
  }
}


