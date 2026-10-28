
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
