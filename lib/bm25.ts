import type { Evidence } from "./evidence";
import { splitIntoParagraphs } from "./evidence";

const K1 = 1.5;
const B = 0.75;

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were",
  "in", "on", "of", "to", "for", "and", "or",
  "did", "why", "how", "what", "with", "from",
  "by", "its",
]);

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => !STOP_WORDS.has(token)) ?? []
  );
}

export function retrieveEvidenceBM25(
  text: string,
  query: string,
  topK = 5
): Evidence[] {
  if (topK <= 0) {
    return [];
  }

  const paragraphs = splitIntoParagraphs(text);
  const documents = paragraphs.map(tokenize);

  const queryTokens = [...new Set(tokenize(query))];

  if (documents.length === 0 || queryTokens.length === 0) {
    return [];
  }

  const N = documents.length;

  const avgdl =
    documents.reduce((sum, doc) => sum + doc.length, 0) / N;

  // Document frequency: number of paragraphs containing each term.
  const documentFrequency = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(doc);

    for (const term of uniqueTerms) {
      documentFrequency.set(
        term,
        (documentFrequency.get(term) ?? 0) + 1
      );
    }
  }

  const results = documents.map((doc, index) => {
    const termFrequency = new Map<string, number>();

    for (const term of doc) {
      termFrequency.set(
        term,
        (termFrequency.get(term) ?? 0) + 1
      );
    }

    let score = 0;

    for (const term of queryTokens) {
      const tf = termFrequency.get(term) ?? 0;

      if (tf === 0) {
        continue;
      }

      const df = documentFrequency.get(term) ?? 0;

      const idf = Math.log(
        1 + (N - df + 0.5) / (df + 0.5)
      );

      const denominator =
        tf +
        K1 * (1 - B + B * (doc.length / avgdl));

      score += idf * ((tf * (K1 + 1)) / denominator);
    }

    return {
      paragraphId: `mda-p-${index + 1}`,
      text: paragraphs[index],
      score,
    };
  });

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}