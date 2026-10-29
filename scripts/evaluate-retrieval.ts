import { readFileSync } from "node:fs";

import {
  evaluateRetrieval,
  type RelevanceGrades,
} from "../lib/retrieval-evaluation";

interface EvaluationQuery {
  id: string;
  ticker: string;
  query: string;
  description: string;
  relevanceGrades: RelevanceGrades;
}

interface Evidence {
  paragraphId: string;
  text: string;
  score: number;
}

interface EvidenceResponse {
  evidence: Evidence[];
}

const queries = JSON.parse(
  readFileSync("data/retrieval-queries.json", "utf8")
) as EvaluationQuery[];

const BASE_URL =
  process.env.EVAL_BASE_URL ?? "http://localhost:3000";

const K = 3;

async function retrieveEvidence(
  ticker: string,
  query: string,
  method: "baseline" | "bm25"
): Promise<Evidence[]> {
  const params = new URLSearchParams({
    ticker,
    query,
    method,
  });

  const response = await fetch(
    `${BASE_URL}/api/evidence?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Evidence retrieval failed: ${response.status}`
    );
  }

  const data = (await response.json()) as EvidenceResponse;

  if (!Array.isArray(data.evidence)) {
    throw new Error("Invalid evidence response");
  }

  return data.evidence;
}

async function main() {
  const methods = ["baseline", "bm25"] as const;

  const summary = {
    baseline: {
      precision: [] as number[],
      reciprocalRank: [] as number[],
      ndcg: [] as number[],
    },
    bm25: {
      precision: [] as number[],
      reciprocalRank: [] as number[],
      ndcg: [] as number[],
    },
  };

  for (const item of queries) {
    console.log(`\nQuery: ${item.id}`);
    console.log(`Ticker: ${item.ticker}`);
    console.log(`Question: ${item.query}`);

    const rows = [];

    for (const method of methods) {
      const evidence = await retrieveEvidence(
        item.ticker,
        item.query,
        method
      );

      const metrics = evaluateRetrieval(
        evidence.map((e) => e.paragraphId),
        item.relevanceGrades,
        K
      );

      summary[method].precision.push(
        metrics.precisionAtK
      );

      summary[method].reciprocalRank.push(
        metrics.reciprocalRank
      );

      summary[method].ndcg.push(
        metrics.ndcgAtK
      );

      rows.push({
        method,
        precisionAt3: metrics.precisionAtK.toFixed(3),
        reciprocalRank:
          metrics.reciprocalRank.toFixed(3),
        ndcgAt3: metrics.ndcgAtK.toFixed(3),
        topParagraph: evidence[0]?.paragraphId ?? "N/A",
      });
    }

    console.table(rows);
  }

  const average = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) /
        values.length;

  console.log("\n=== Overall Retrieval Evaluation ===");

  console.table(
    methods.map((method) => ({
      method,
      meanPrecisionAt3: average(
        summary[method].precision
      ).toFixed(3),
      MRRAt3: average(
        summary[method].reciprocalRank
      ).toFixed(3),
      meanNDCGAt3: average(
        summary[method].ndcg
      ).toFixed(3),
    }))
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});