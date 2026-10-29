export type MDASection = {
  section: "Item 7";
  title: string;
  text: string;
  characterCount: number;
};

export function extractMDA(
  filingText: string
): MDASection | null {
  const startPattern =
    /item\s+7[\s.:—-]+management['’]?s\s+discussion\s+and\s+analysis/gi;

  const endPattern =
    /item\s+7a[\s.:—-]+quantitative\s+and\s+qualitative\s+disclosures/gi;

  const starts = [...filingText.matchAll(startPattern)];

  if (starts.length === 0) {
    return null;
  }

  const candidates: string[] = [];

  for (const match of starts) {
    if (match.index === undefined) {
      continue;
    }

    const startIndex = match.index + match[0].length;

    const remainingText = filingText.slice(startIndex);

    const endMatch = endPattern.exec(remainingText);

    // Reset regex state before the next iteration.
    endPattern.lastIndex = 0;

    if (!endMatch) {
      continue;
    }

    const candidate = remainingText
      .slice(0, endMatch.index)
      .trim();

    if (candidate.length > 3000) {
      candidates.push(candidate);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Prefer the longest plausible section.
  const text = candidates.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );

  return {
    section: "Item 7",
    title:
      "Management's Discussion and Analysis of Financial Condition and Results of Operations",
    text,
    characterCount: text.length,
  };
}