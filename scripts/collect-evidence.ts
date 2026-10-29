import { readFileSync, writeFileSync } from "node:fs";

interface Query {
  id: string;
  ticker: string;
  query: string;
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
  readFileSync("data/benchmark-queries.json", "utf8")
) as Query[];

const BASE_URL =
  process.env.EVAL_BASE_URL ?? "http://localhost:3000";

async function retrieve(
  item: Query,
  method: "baseline" | "bm25"
): Promise<Evidence[]> {
  const params = new URLSearchParams({
    ticker: item.ticker,
    query: item.query,
    method,
  });

  const response = await fetch(
    `${BASE_URL}/api/evidence?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `${item.id}: ${method} returned HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as EvidenceResponse;

  if (!Array.isArray(data.evidence)) {
    throw new Error(`Invalid response for ${item.id}`);
  }

  return data.evidence;
}

async function main() {
  const output = [];

  for (const item of queries) {
    const baseline = await retrieve(item, "baseline");
    const bm25 = await retrieve(item, "bm25");

    const candidates = new Map<
      string,
      {
        paragraphId: string;
        text: string;
        baselineRank: number | null;
        bm25Rank: number | null;
        relevanceGrade: number | null;
      }
    >();

    baseline.slice(0, 5).forEach((evidence, index) => {
      candidates.set(evidence.paragraphId, {
        paragraphId: evidence.paragraphId,
        text: evidence.text,
        baselineRank: index + 1,
        bm25Rank: null,
        relevanceGrade: null,
      });
    });

    bm25.slice(0, 5).forEach((evidence, index) => {
      const existing = candidates.get(evidence.paragraphId);

      if (existing) {
        existing.bm25Rank = index + 1;
      } else {
        candidates.set(evidence.paragraphId, {
          paragraphId: evidence.paragraphId,
          text: evidence.text,
          baselineRank: null,
          bm25Rank: index + 1,
          relevanceGrade: null,
        });
      }
    });

    output.push({
      ...item,
      candidates: [...candidates.values()],
    });

    console.log(
      `${item.id}: collected ${candidates.size} unique paragraphs`
    );
  }

  writeFileSync(
    "data/evidence-candidates.json",
    JSON.stringify(output, null, 2)
  );

  console.log("\nSaved to data/evidence-candidates.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
