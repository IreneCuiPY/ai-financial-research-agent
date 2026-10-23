
import { NextRequest, NextResponse } from "next/server";

const companies = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    revenue: 130.5,
    revenueGrowth: 114,
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    revenue: 391.0,
    revenueGrowth: 2,
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    revenue: 245.1,
    revenueGrowth: 16,
  },
};

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams
    .get("ticker")
    ?.trim()
    .toUpperCase();

  if (!ticker || !(ticker in companies)) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 }
    );
  }

  const company = companies[ticker as keyof typeof companies];

  return NextResponse.json({
    ...company,
    dataType: "demo",
  });
}
