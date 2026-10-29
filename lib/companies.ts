export type CompanyInfo = {
  ticker: string;
  name: string;
  cik: number;
};

export const companies: Record<string, CompanyInfo> = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    cik: 320193,
  },

  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    cik: 1045810,
  },

  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    cik: 789019,
  },
};

export function getCompanyByTicker(
  ticker: string
): CompanyInfo | null {
  const normalizedTicker = ticker.trim().toUpperCase();

  return companies[normalizedTicker] ?? null;
}