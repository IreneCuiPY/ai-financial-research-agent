import { describe, it, expect } from "vitest";
import { extractMDA } from "../lib/mda";

describe("MD&A Extraction", () => {
  it("extracts Item 7 content", () => {
    const filingText = `
      Item 7. Management's Discussion and Analysis

      ${"Revenue increased due to higher demand. ".repeat(150)}

      Item 7A. Quantitative and Qualitative Disclosures About Market Risk
    `;

    const result = extractMDA(filingText);

    expect(result).not.toBeNull();
    expect(result?.section).toBe("Item 7");
    expect(result?.text).toContain("Revenue increased");
    expect(result?.characterCount).toBeGreaterThan(3000);
  });

  it("returns null when Item 7 is missing", () => {
    const result = extractMDA(
      "This document does not contain an MD&A section."
    );

    expect(result).toBeNull();
  });
});