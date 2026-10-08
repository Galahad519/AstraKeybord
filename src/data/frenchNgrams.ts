import { FRENCH_WORDS } from './frenchWords';
import type { Distribution } from '../engine/types';
// Approximate starting priors, extended with French accented letters.
export const LETTER_FREQUENCIES: Distribution = {
  e: 14.7, a: 7.6, i: 7.5, s: 7.9, n: 7.1, r: 6.6, t: 7.2, o: 5.4,
  l: 5.5, u: 6.3, d: 3.7, c: 3.3, m: 3, p: 3, é: 2.5, v: 1.8, q: 1.4,
  f: 1.1, b: 1, g: 1, h: 0.7, j: 0.6, x: 0.4, y: 0.3, z: 0.15, k: 0.1,
  w: 0.08, è: 0.5, ê: 0.25, à: 0.5, ù: 0.04, ç: 0.15, ô: 0.1, î: 0.1,
  â: 0.1, û: 0.06, ë: 0.02, ï: 0.04, ü: 0.01, œ: 0.04, æ: 0.01, ÿ: 0.001,
};
export const BIGRAMS: Record<string, Distribution> = {};
export const TRIGRAMS: Record<string, Distribution> = {};
// Build once at module load; spaces mark word beginnings, punctuation boundaries reset context.
for (const { word, weight } of FRENCH_WORDS) {
  const chars = Array.from(` ${word.toLocaleLowerCase('fr')}`);
  for (let i = 1; i < chars.length; i++) {
    const next = chars[i];
    if (!(next in LETTER_FREQUENCIES)) continue;
    const previous = chars[i - 1];
    const bigram = BIGRAMS[previous] ??= {};
    bigram[next] = (bigram[next] ?? 0) + weight;
    if (i > 1) {
      const trigram = TRIGRAMS[chars[i - 2] + previous] ??= {};
      trigram[next] = (trigram[next] ?? 0) + weight;
    }
  }
}
// Editable overrides for especially useful contexts.
Object.assign(TRIGRAMS, { qu: { e: 70, i: 22, a: 6, o: 2 }, me: { n: 30, r: 25, t: 20, s: 15, u: 10 } });
