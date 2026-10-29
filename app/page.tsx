"use client";

import { useState, type FormEvent } from "react";

type FinancialData = {
  ticker: string;
  company: string;
  cik: number;
  fiscalYear: number;
  revenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  currency: string;
  source: string;
  revenueTag: string;
  periodEnd: string;
  previousPeriodEnd: string;
  filed: string;
};

function formatBillions(value: number): string {
  return `$${(value / 1_000_000_000).toFixed(2)}B`;
}

export default function Home() {
  const [ticker, setTicker] = useState("NVDA");

  const [financials, setFinancials] =
    useState<FinancialData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const symbol = ticker.trim().toUpperCase();

    if (!symbol) {
      setError("Please enter a ticker symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setFinancials(null);

    try {
      const response = await fetch(
        `/api/company?ticker=${encodeURIComponent(symbol)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch financial data"
        );
      }

      const data: FinancialData = await response.json();

      setFinancials(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">
        AI Financial Research Agent
      </h1>

      <p className="mt-4 text-gray-500">
        Financial analysis powered by SEC EDGAR data.
      </p>

      <form
        onSubmit={analyzeCompany}
        className="mt-8 flex gap-3"
      >
        <input
          type="text"
          value={ticker}
          onChange={(event) =>
            setTicker(event.target.value.toUpperCase())
          }
          placeholder="Enter ticker (e.g. NVDA)"
          aria-label="Stock ticker"
          className="w-64 rounded-lg border border-gray-300 px-4 py-3 text-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Company"}
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {financials && (
        <section className="mt-10 rounded-xl border border-gray-300 p-6">
          <h2 className="text-2xl font-bold">
            {financials.company}
          </h2>

          <p className="mt-2 text-gray-500">
            {financials.ticker} | Fiscal Year{" "}
            {financials.fiscalYear}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              title="Revenue"
              value={formatBillions(financials.revenue)}
            />

            <MetricCard
              title="Previous Revenue"
              value={formatBillions(financials.previousRevenue)}
            />

            <MetricCard
              title="YoY Growth"
              value={`${(financials.revenueGrowth * 100).toFixed(2)}%`}
            />
          </div>

          <div className="mt-8 border-t pt-5 text-sm text-gray-500">
            <p>Source: {financials.source}</p>
            <p>Period End: {financials.periodEnd}</p>
            <p>Filed: {financials.filed}</p>
            <p>Revenue Metric: {financials.revenueTag}</p>
          </div>
        </section>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-100 p-5 text-gray-900">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}