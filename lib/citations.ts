import type { SecFiling } from "./sec";

export type FinancialCitation = {
  source: "SEC EDGAR";
  documentType: string;
  filingDate: string;
  reportDate: string;
  accessionNumber: string;
  url: string;
};

export function createFilingCitation(
  filing: SecFiling
): FinancialCitation {
  return {
    source: "SEC EDGAR",
    documentType: filing.form,
    filingDate: filing.filingDate,
    reportDate: filing.reportDate,
    accessionNumber: filing.accessionNumber,
    url: filing.url,
  };
}