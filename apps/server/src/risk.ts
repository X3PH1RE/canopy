export interface RiskInput {
  id: number;
  loc: number;
  complexity: number;
  churn: number;
  authorCount: number;
}

export function scoreRisks(files: RiskInput[]): Map<number, number> {
  const churnRanks = percentileRanks(files.map((file) => file.churn));
  const complexityRanks = percentileRanks(files.map((file) => file.complexity));
  const locRanks = percentileRanks(files.map((file) => file.loc));
  const scores = new Map<number, number>();

  files.forEach((file, index) => {
    if (file.loc < 20) {
      scores.set(file.id, 0);
      return;
    }

    const base =
      0.4 * churnRanks[index]! +
      0.35 * complexityRanks[index]! +
      0.25 * locRanks[index]!;
    const boosted = file.authorCount === 1 && churnRanks[index]! >= 0.8 ? base * 1.15 : base;
    scores.set(file.id, clamp01(boosted));
  });

  return scores;
}

function percentileRanks(values: number[]): number[] {
  if (values.length <= 1) {
    return values.map(() => 0);
  }

  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index);
  const ranks = new Array<number>(values.length);

  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end]!.value === sorted[start]!.value) {
      end += 1;
    }

    const averageRank = (start + end - 1) / 2;
    for (let cursor = start; cursor < end; cursor += 1) {
      ranks[sorted[cursor]!.index] = averageRank / (values.length - 1);
    }

    start = end;
  }

  return ranks;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
