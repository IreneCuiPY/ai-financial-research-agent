
"use client";

import { useState } from "react";

type FinancialData = {
  company: string;
  cik: number;
  fiscalYear: number;
  revenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  currency: string;
  source: string;
  periodEnd: string;
  filed: string;
};

export default function Home() {
  const [financials, setFinancials] =
    useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function analyzeCompany() {
    setLoading(true);
    setError(null);
    setFinancials(null);

    try {
      const response = await fetch("/api/financials");

      if (!response.ok) {
        throw new Error("Failed to fetch financial data");
      }

      const data: FinancialData = await response.json();

      setFinancials(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load financial data.");
    } finally {
      setLoading(false);
    }
  }
  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <main className="mx-auto max-w-4xl p-10">
      <h1 className="text-3xl font-bold">
        AI Financial Research Agent
      </h1>

      <p className="mt-3 text-gray-500">
        Financial analysis powered by SEC EDGAR data.
      </p>

      <button
        onClick={analyzeCompany}
        disabled={loading}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Apple"}
      </button>

      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}

      {financials && (
        <section className="mt-8 rounded-xl border p-6">
          <h2 className="text-2xl font-semibold">
            {financials.company}
          </h2>

          <p className="mt-2 text-gray-500">
            Fiscal Year {financials.fiscalYear}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-100 p-5 text-gray-900">
              <p className="text-sm text-gray-500">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(financials.revenue)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 p-5 text-gray-900">
              <p className="text-sm text-gray-500">
                Previous Revenue
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(financials.previousRevenue)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 p-5 text-gray-900">
              <p className="text-sm text-gray-500">
                YoY Growth
              </p>
              <p className="mt-2 text-2xl font-bold">
                {(financials.revenueGrowth * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4 text-sm text-gray-500">
            <p>Source: {financials.source}</p>
            <p>Period End: {financials.periodEnd}</p>
            <p>Filed: {financials.filed}</p>
          </div>
        </section>
      )}
    </main>
  );
}