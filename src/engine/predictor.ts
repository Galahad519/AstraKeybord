import { LETTER_FREQUENCIES } from '../data/frenchNgrams';
import { dictionaryDistribution, getCurrentPrefix } from './dictionary';
import { getNgramDistribution } from './ngram';
import { normalize, PREDICTION_WEIGHTS as weights } from './ranking';
import type { Prediction, PredictionEngine } from './types';
const frequency = normalize(LETTER_FREQUENCIES);
export function predictNextCharacters(text: string): Prediction[] {
  const { distribution, source } = getNgramDistribution(text);
  const ngram = normalize(distribution);
  const dictionary = normalize(dictionaryDistribution(getCurrentPrefix(text)));
  const predictions = Object.keys(frequency).map(char => {
    const contributions = {
      ngram: (ngram[char] ?? 0) * weights.ngram,
      dictionary: (dictionary[char] ?? 0) * weights.dictionary,
      frequency: frequency[char] * weights.frequency,
    };
    return { char, score: contributions.ngram + contributions.dictionary + contributions.frequency,
      probability: 0, contributions, source };
  });
  const sum = predictions.reduce((total, item) => total + item.score, 0);
  return predictions.map(item => ({ ...item, probability: item.score / sum }))
    .sort((a, b) => b.score - a.score || (a.char < b.char ? -1 : 1));
}
export const predictTop5 = (text: string): Prediction[] => predictNextCharacters(text).slice(0, 5);
export const predictionEngine: PredictionEngine = { predict: predictNextCharacters };
