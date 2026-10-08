import { FRENCH_WORDS } from '../data/frenchWords';
import type { Distribution } from './types';
export const normalizeText = (text: string) => text.normalize('NFC').toLocaleLowerCase('fr');
export function getCurrentPrefix(text: string): string {
  return normalizeText(text).match(/\p{L}+$/u)?.[0] ?? '';
}
const prefixes = new Map<string, Distribution>();
for (const { word, weight } of FRENCH_WORDS) {
  // Apostrophes / hyphens delimit prefix segments consistently with getCurrentPrefix.
  for (const part of normalizeText(word).split(/[^\p{L}]+/u)) {
    const chars = Array.from(part);
    for (let i = 0; i < chars.length; i++) {
      const prefix = chars.slice(0, i).join('');
      const distribution = prefixes.get(prefix) ?? {};
      distribution[chars[i]] = (distribution[chars[i]] ?? 0) + weight;
      prefixes.set(prefix, distribution);
    }
  }
}
export function dictionaryDistribution(prefix: string): Distribution {
  return { ...prefixes.get(normalizeText(prefix)) };
}
