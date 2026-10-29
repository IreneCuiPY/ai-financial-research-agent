
const SEC_BASE_URL = "https://data.sec.gov/api/xbrl/companyfacts";

type SECCompanyFacts = {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap": Record<string, unknown>;
  };
};

export async function getCompanyFacts(
  cik: number
): Promise<SECCompanyFacts> {
  const paddedCIK = String(cik).padStart(10, "0");

  const response = await fetch(
    `${SEC_BASE_URL}/CIK${paddedCIK}.json`,
    {
      headers: {
        "User-Agent": process.env.SEC_USER_AGENT ?? "",
        Accept: "application/json",
      },
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `SEC API request failed: ${response.status}`
    );
  }

  return (await response.json()) as SECCompanyFacts;
}

export type SecFiling = {
  form: string;
  filingDate: string;
  reportDate: string;
  accessionNumber: string;
  primaryDocument: string;
  url: string;
};

type SecSubmissions = {
  filings: {
    recent: {
      form: string[];
      filingDate: string[];
      reportDate: string[];
      accessionNumber: string[];
      primaryDocument: string[];
    };
  };
};

export async function getLatest10K(
  cik: number
): Promise<SecFiling | null> {
  const paddedCik = String(cik).padStart(10, "0");

  const response = await fetch(
    `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
    {
      headers: {
        "User-Agent":
          process.env.SEC_USER_AGENT || "",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error(
      `SEC submissions request failed: ${response.status}`
    );
  }

  const data: SecSubmissions = await response.json();
  const recent = data.filings.recent;

  const index = recent.form.findIndex(
    (form) => form === "10-K"
  );

  if (index === -1) {
    return null;
  }

  const accessionNumber = recent.accessionNumber[index];
  const primaryDocument = recent.primaryDocument[index];

  const accessionNoDashes =
    accessionNumber.replace(/-/g, "");

  const url =
    `https://www.sec.gov/Archives/edgar/data/` +
    `${cik}/${accessionNoDashes}/${primaryDocument}`;

  return {
    form: recent.form[index],
    filingDate: recent.filingDate[index],
    reportDate: recent.reportDate[index],
    accessionNumber,
    primaryDocument,
    url,
  };
}