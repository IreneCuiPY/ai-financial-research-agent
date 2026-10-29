import { describe, it, expect } from "vitest";

import {
  evaluateRetrieval,
} from "../lib/retrieval-evaluation";

describe("Retrieval Evaluation", () => {
  const grades = {
    "mda-p-5": 2,
    "mda-p-18": 2,
    "mda-p-40": 2,
    "mda-p-42": 1,
  } as const;

  it("calculates precision at 3", () => {
    const result = evaluateRetrieval(
      ["mda-p-5", "mda-p-18", "mda-p-42"],
      grades,
      3
    );

    expect(result.precisionAtK).toBeCloseTo(2 / 3);
    expect(result.hitsAtK).toBe(2);
  });

  it("calculates reciprocal rank", () => {
    const result = evaluateRetrieval(
      ["mda-p-42", "mda-p-5", "mda-p-18"],
      grades,
      3
    );

    expect(result.reciprocalRank).toBe(0.5);
  });

  it("returns NDCG of 1 for ideal ranking", () => {
    const result = evaluateRetrieval(
      ["mda-p-5", "mda-p-18", "mda-p-40"],
      grades,
      3
    );

    expect(result.ndcgAtK).toBeCloseTo(1);
  });

  it("penalizes partially relevant top results", () => {
    const result = evaluateRetrieval(
      ["mda-p-42", "mda-p-5", "mda-p-18"],
      grades,
      3
    );

    expect(result.ndcgAtK).toBeGreaterThan(0);
    expect(result.ndcgAtK).toBeLessThan(1);
  });

  it("returns zero when no relevant evidence exists", () => {
    const result = evaluateRetrieval(
      ["mda-p-50", "mda-p-60"],
      grades,
      3
    );

    expect(result.precisionAtK).toBe(0);
    expect(result.reciprocalRank).toBe(0);
    expect(result.ndcgAtK).toBe(0);
  });

  it("rejects invalid k", () => {
    expect(() =>
      evaluateRetrieval(["mda-p-5"], grades, 0)
    ).toThrow();
  });
});