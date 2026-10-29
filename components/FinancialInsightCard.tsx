type GrowthInsight = {
  status: "accelerating" | "decelerating" | "stable";
  currentGrowth: number;
  previousGrowth: number;
  changePercentagePoints: number;
  summary: string;
};

type Props = {
  insight: GrowthInsight | null;
};

export default function FinancialInsightCard({ insight }: Props) {
  if (!insight) {
    return null;
  }

  const statusLabels = {
    accelerating: "Growth Accelerating",
    decelerating: "Growth Decelerating",
    stable: "Growth Stable",
  };

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-900">
      <h3 className="text-xl font-semibold">
        Automated Financial Insights
      </h3>

      <p className="mt-4 text-lg font-medium">
        {statusLabels[insight.status]}
      </p>

      <p className="mt-3 text-sm leading-6 text-gray-600">
        {insight.summary}
      </p>

      <p className="mt-4 text-xs text-gray-500">
        Rule-based analysis of SEC EDGAR financial data.
      </p>
    </section>
  );
}