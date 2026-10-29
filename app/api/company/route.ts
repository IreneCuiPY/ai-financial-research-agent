import { NextRequest, NextResponse } from "next/server";

import { getCompanyFacts } from "@/lib/sec";
import { getCompanyByTicker } from "@/lib/companies";
import { analyzeRevenueGrowth } from "@/lib/insights";
import {
  extractAnnualRevenue,
  calculateRevenueGrowth,
  calculateRevenueGrowthHistory,
  type RevenueRecord,
} from "@/lib/revenue";

export async function GET(request: NextRequest) {
  try {
    // 1. Read ticker from URL
    const ticker = request.nextUrl.searchParams.get("ticker");

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

    // 2. Convert ticker to SEC CIK
    const company = getCompanyByTicker(ticker);

    if (!company) {
      return NextResponse.json(
        { error: "Unsupported ticker" },
        { status: 404 }
      );
    }

    // 3. Fetch SEC financial data
    const data = await getCompanyFacts(company.cik);

    // 4. Find revenue metric
    const revenueTags = [
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "Revenues",
      "SalesRevenueNet",
    ];

    let selectedTag: string | null = null;
    let annual: ReturnType<typeof extractAnnualRevenue> = [];

    for (const tag of revenueTags) {
        const metric = data.facts["us-gaap"][tag] as
            | { units?: { USD?: RevenueRecord[] } }
            | undefined;

        if (!metric?.units?.USD?.length) {
            continue;
        }

        const candidateAnnual = extractAnnualRevenue(
            metric.units.USD
        );

        if (candidateAnnual.length === 0) {
            continue;
         }

        const candidateLatest =
            candidateAnnual[candidateAnnual.length - 1];

        const currentLatest =
            annual.length > 0
                ? annual[annual.length - 1]
                : null;

        if (
            !currentLatest ||
            candidateLatest.end > currentLatest.end
        ) {
            annual = candidateAnnual;
            selectedTag = tag;
        }
    }

    if (annual.length === 0) {
        return NextResponse.json(
            { error: "Revenue data unavailable" },
            { status: 404 }
        );
    }


    if (annual.length < 2) {
        return NextResponse.json(
            { error: "Insufficient annual revenue data" },
            { status: 422 }
        );
    }

    // 5. Extract up to 5 years of revenue history
    const recentAnnual = annual.slice(-6);

    const growthHistory = calculateRevenueGrowthHistory(recentAnnual);

    const revenueHistory = recentAnnual.slice(-5).map((record) => {
        const growthRecord = growthHistory.find(
            (item) => item.fiscalYear === record.fiscalYear
        );

        return {
            fiscalYear: record.fiscalYear,
            revenue: record.revenue,
            growth: growthRecord?.growth ?? null,
            periodEnd: record.end,
            filed: record.filed,
        };
    });

    const growthInsight = analyzeRevenueGrowth(revenueHistory);

    // 6. Calculate YoY growth
    const current = annual[annual.length - 1];
    const previous = annual[annual.length - 2];

    const revenueGrowth = calculateRevenueGrowth(
      current.revenue,
      previous.revenue
    );

    // 7. Return structured financial data
    return NextResponse.json({
      ticker: company.ticker,
      company: data.entityName,
      cik: data.cik,
      fiscalYear: current.fiscalYear,
      revenue: current.revenue,
      previousRevenue: previous.revenue,
      revenueGrowth,
      currency: "USD",
      source: "SEC EDGAR",
      revenueTag: selectedTag,
      periodEnd: current.end,
      previousPeriodEnd: previous.end,
      filed: current.filed,
      revenueHistory,
      growthInsight,
    });
  } catch (error) {
    console.error("Financial analytics error:", error);

    return NextResponse.json(
      { error: "Unable to calculate financial metrics" },
      { status: 500 }
    );
  }
}
