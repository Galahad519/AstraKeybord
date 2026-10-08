import { BIGRAMS, TRIGRAMS, LETTER_FREQUENCIES } from '../data/frenchNgrams';
import { getCurrentPrefix } from './dictionary';
import type { Distribution, NgramSource } from './types';
export function getNgramDistribution(text: string): { distribution: Distribution; source: NgramSource } {
  const context = ` ${getCurrentPrefix(text)}`;
  const trigram = TRIGRAMS[context.slice(-2)];
  if (trigram) return { distribution: trigram, source: 'trigram' };
  const bigram = BIGRAMS[context.slice(-1)];
  if (bigram) return { distribution: bigram, source: 'bigram' };
  return { distribution: LETTER_FREQUENCIES, source: 'frequency' };
}
