export type Distribution = Record<string, number>;
export type NgramSource = 'trigram' | 'bigram' | 'frequency';
export interface Prediction {
  char: string;
  score: number;
  probability: number;
  contributions: { ngram: number; dictionary: number; frequency: number };
  source: NgramSource;
}
export interface PredictionEngine {
  predict(text: string): Prediction[];
}
