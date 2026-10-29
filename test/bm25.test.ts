import { describe, it, expect } from "vitest";
import { retrieveEvidenceBM25 } from "../lib/bm25";

describe("BM25 Evidence Retrieval", () => {
  const text = [
    "Revenue increased because demand for AI infrastructure grew significantly during the fiscal year.",
    "Operating expenses increased because the company invested heavily in research and development.",
    "Revenue growth was primarily driven by strong Data Center demand and increased AI computing adoption.",
    "The company operates globally and faces several risks associated with international business activities.",
  ].join("\n\n");

  it("returns relevant evidence", () => {
    const results = retrieveEvidenceBM25(
      text,
      "revenue growth",
      3
    );

    expect(results.length).toBeGreaterThan(0);

    expect(
      results[0].text.toLowerCase()
    ).toContain("revenue");
  });

  it("returns no evidence for unrelated queries", () => {
    const results = retrieveEvidenceBM25(
      text,
      "cryptocurrency mining",
      3
    );

    expect(results).toHaveLength(0);
  });

  it("respects topK", () => {
    const results = retrieveEvidenceBM25(
      text,
      "revenue",
      1
    );

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("returns no results for empty queries", () => {
    const results = retrieveEvidenceBM25(
      text,
      "",
      5
    );

    expect(results).toHaveLength(0);
  });

  it("assigns positive scores to matching paragraphs", () => {
    const results = retrieveEvidenceBM25(
      text,
      "data center revenue",
      3
    );

    expect(results.every((item) => item.score > 0)).toBe(true);
  });
});