
"use client";

import { useState } from "react";

type Company = {
  ticker: string;
  name: string;
  revenue: number;
  revenueGrowth: number;
  dataType: string;
};

export default function Home() {
  const [ticker, setTicker] = useState("NVDA");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeCompany() {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError("Please enter a ticker.");
      setCompany(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      const response = await fetch(
        `/api/company?ticker=${encodeURIComponent(normalizedTicker)}`
      );

      if (!response.ok) {
        throw new Error("Company not found");
      }

      const data: Company = await response.json();
      setCompany(data);
    } catch (err) {
      setError("Unable to find this company.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-3xl font-bold">
        AI Financial Research Agent
      </h1>

      <p className="mt-3 text-gray-500">
        Analyze companies with financial data and AI.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void analyzeCompany();
        }}
        className="mt-6 flex gap-3"
      >
        <input
          type="text"
          value={ticker}
          onChange={(event) => setTicker(event.target.value)}
          placeholder="Enter ticker"
          className="min-w-0 flex-1 rounded-lg border px-4 py-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}

      {company && (
        <div className="mt-8 rounded-lg border p-6">
          <h2 className="text-xl font-semibold">
            {company.name}
          </h2>

          <p className="mt-2">Ticker: {company.ticker}</p>
          <p>Revenue: ${company.revenue}B</p>
          <p>Revenue Growth: {company.revenueGrowth}%</p>

          <p className="mt-4 text-sm text-gray-500">
            Demo data — not live financial information.
          </p>
        </div>
      )}
    </main>
  );
}
