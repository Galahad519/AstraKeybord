import type { Distribution } from './types';
export const PREDICTION_WEIGHTS = { ngram: 0.55, dictionary: 0.35, frequency: 0.10 } as const;
export function normalize(distribution: Distribution): Distribution {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(distribution).map(([char, value]) => [char, total ? value / total : 0]));
}
