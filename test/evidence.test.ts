import { describe, it, expect } from "vitest";

import {
  splitIntoParagraphs,
  retrieveEvidence,
} from "../lib/evidence";

describe("Financial Evidence Retrieval", () => {
  const text = `
Revenue increased significantly due to strong demand for
AI infrastructure and accelerated computing products.

Revenue growth was primarily driven by higher Data Center
sales and increased demand for AI computing platforms.

Operating expenses increased due to research and
development investments in new technologies.
`;

  it("splits text into paragraphs", () => {
    const paragraphs = splitIntoParagraphs(text);

    expect(paragraphs.length).toBe(3);
  });

  it("retrieves paragraphs relevant to revenue", () => {
    const evidence = retrieveEvidence(
      text,
      "revenue growth",
      2
    );

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].text.toLowerCase()).toContain("revenue");
  });

  it("returns no evidence for unrelated queries", () => {
    const evidence = retrieveEvidence(
      text,
      "cryptocurrency mining",
      5
    );

    expect(evidence).toHaveLength(0);
  });

  it("respects topK", () => {
    const evidence = retrieveEvidence(
      text,
      "revenue",
      1
    );

    expect(evidence.length).toBeLessThanOrEqual(1);
  });
});