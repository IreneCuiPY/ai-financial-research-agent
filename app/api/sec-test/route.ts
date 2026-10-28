
import { NextResponse } from "next/server";
import { getCompanyFacts } from "@/lib/sec";

export async function GET() {
  try {
    const data = await getCompanyFacts(320193);

    return NextResponse.json({
      company: data.entityName,
      cik: data.cik,
      availableMetrics: Object.keys(
        data.facts["us-gaap"]
      ).length,
    });
  } catch (error) {
    console.error("SEC request failed:", error);

    return NextResponse.json(
      { error: "Unable to fetch SEC data" },
      { status: 502 }
    );
  }
}

