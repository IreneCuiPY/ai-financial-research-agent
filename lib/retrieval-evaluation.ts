export type RelevanceGrades = Record<string, 0 | 1 | 2>;

export interface RetrievalMetrics {
  precisionAtK: number;
  reciprocalRank: number;
  hitsAtK: number;
  ndcgAtK: number;
}

function dcg(grades: number[]): number {
  return grades.reduce((sum, grade, index) => {
    const gain = Math.pow(2, grade) - 1;
    const discount = Math.log2(index + 2);

    return sum + gain / discount;
  }, 0);
}

export function evaluateRetrieval(
  retrievedIds: string[],
  relevanceGrades: RelevanceGrades,
  k = 3
): RetrievalMetrics {
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error("k must be a positive integer");
  }

  const topK = retrievedIds.slice(0, k);

  // For binary metrics, only grade 2 counts as directly relevant.
  const isRelevant = (id: string) =>
    relevanceGrades[id] === 2;

  const hitsAtK = topK.filter(isRelevant).length;

  const precisionAtK = hitsAtK / k;

  // Reciprocal rank of the first directly relevant result.
  const firstRelevantIndex = topK.findIndex(isRelevant);

  const reciprocalRank =
    firstRelevantIndex === -1
      ? 0
      : 1 / (firstRelevantIndex + 1);

  // Actual ranking gains.
  const actualGrades = topK.map(
    (id) => relevanceGrades[id] ?? 0
  );

  const actualDCG = dcg(actualGrades);

  // Best possible ranking from all annotated paragraphs.
  const idealGrades = Object.values(relevanceGrades)
    .sort((a, b) => b - a)
    .slice(0, k);

  const idealDCG = dcg(idealGrades);

  const ndcgAtK =
    idealDCG === 0
      ? 0
      : actualDCG / idealDCG;

  return {
    precisionAtK,
    reciprocalRank,
    hitsAtK,
    ndcgAtK,
  };
}