import * as cheerio from "cheerio";

export async function downloadFilingText(
  url: string
): Promise<string> {
  const parsedUrl = new URL(url);

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "www.sec.gov" ||
    !parsedUrl.pathname.startsWith("/Archives/edgar/data/")
  ) {
    throw new Error("Invalid SEC filing URL");
  }

  const userAgent = process.env.SEC_USER_AGENT;

  if (!userAgent) {
    throw new Error("SEC_USER_AGENT is not configured");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download SEC filing: ${response.status}`
    );
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  $("script, style, noscript").remove();

  // Preserve boundaries between block elements.
  $("p, div, h1, h2, h3, h4, h5, h6, tr, li, br").each(
    (_, element) => {
      $(element).prepend("\n");
      $(element).append("\n");
    }
  );

  const text = $("body").text();

  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}