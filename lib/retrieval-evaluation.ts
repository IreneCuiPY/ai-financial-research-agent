export interface RetrievalMetrics {
  precisionAtK: number;
  reciprocalRank: number;
  hitsAtK: number;
}

export function evaluateRetrieval(
  retrievedIds: string[],
  relevantIds: string[],
  k = 3
): RetrievalMetrics {
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error("k must be a positive integer");
  }

  const relevant = new Set(relevantIds);
  const topK = retrievedIds.slice(0, k);

  const hitsAtK = topK.filter((id) =>
    relevant.has(id)
  ).length;

  const precisionAtK = hitsAtK / k;

  const firstRelevantIndex = retrievedIds.findIndex(
    (id) => relevant.has(id)
  );

  const reciprocalRank =
    firstRelevantIndex === -1
      ? 0
      : 1 / (firstRelevantIndex + 1);

  return {
    precisionAtK,
    reciprocalRank,
    hitsAtK,
  };
}