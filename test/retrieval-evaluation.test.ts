import { describe, it, expect } from "vitest";

import {
  evaluateRetrieval,
} from "../lib/retrieval-evaluation";

describe("Retrieval Evaluation", () => {
  it("calculates precision at 3", () => {
    const retrieved = [
      "mda-p-5",
      "mda-p-18",
      "mda-p-42",
    ];

    const relevant = [
      "mda-p-5",
      "mda-p-18",
      "mda-p-40",
    ];

    const result = evaluateRetrieval(
      retrieved,
      relevant,
      3
    );

    expect(result.precisionAtK).toBeCloseTo(2 / 3);
    expect(result.hitsAtK).toBe(2);
  });

  it("calculates reciprocal rank", () => {
    const retrieved = [
      "mda-p-42",
      "mda-p-5",
      "mda-p-18",
    ];

    const relevant = ["mda-p-5"];

    const result = evaluateRetrieval(
      retrieved,
      relevant,
      3
    );

    expect(result.reciprocalRank).toBe(0.5);
  });

  it("returns zero when no relevant evidence exists", () => {
    const result = evaluateRetrieval(
      ["mda-p-42", "mda-p-50"],
      ["mda-p-5"],
      3
    );

    expect(result.precisionAtK).toBe(0);
    expect(result.reciprocalRank).toBe(0);
  });

  it("rejects invalid k", () => {
    expect(() =>
      evaluateRetrieval(["a"], ["a"], 0)
    ).toThrow();
  });
});