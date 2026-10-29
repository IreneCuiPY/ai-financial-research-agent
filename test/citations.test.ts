import { describe, it, expect } from "vitest";

import { createFilingCitation } from "../lib/citations";

describe("SEC Filing Citations", () => {
  it("creates a citation from filing metadata", () => {
    const filing = {
      form: "10-K",
      filingDate: "2026-02-25",
      reportDate: "2026-01-25",
      accessionNumber: "0000000000-26-000001",
      primaryDocument: "example.htm",
      url: "https://www.sec.gov/example",
    };

    const citation = createFilingCitation(filing);

    expect(citation.source).toBe("SEC EDGAR");
    expect(citation.documentType).toBe("10-K");
    expect(citation.filingDate).toBe("2026-02-25");
    expect(citation.url).toBe(filing.url);
  });
});