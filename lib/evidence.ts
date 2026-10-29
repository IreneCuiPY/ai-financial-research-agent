export type Evidence = {
  paragraphId: string;
  text: string;
  score: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "in",
  "on",
  "of",
  "to",
  "for",
  "and",
  "or",
  "did",
  "why",
  "how",
  "what",
  "with",
  "from",
  "by",
  "its",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => !STOP_WORDS.has(word)) ?? [];
}

export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length >= 80);
}

export function retrieveEvidence(
  text: string,
  query: string,
  topK = 5
): Evidence[] {
  const paragraphs = splitIntoParagraphs(text);

  const queryTokens = new Set(tokenize(query));

  if (queryTokens.size === 0 || topK <= 0) {
    return [];
  }

  const results = paragraphs.map((paragraph, index) => {
    const paragraphTokens = new Set(tokenize(paragraph));

    let matches = 0;

    for (const token of queryTokens) {
      if (paragraphTokens.has(token)) {
        matches++;
      }
    }

    const score = matches / queryTokens.size;

    return {
      paragraphId: `mda-p-${index + 1}`,
      text: paragraph,
      score,
    };
  });

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}