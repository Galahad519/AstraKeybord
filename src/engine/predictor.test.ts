import { describe, expect, it } from 'vitest';
import { predictNextCharacters, predictTop5 } from './predictor';
import { dictionaryDistribution, getCurrentPrefix } from './dictionary';
import { getNgramDistribution } from './ngram';
import { FRENCH_WORDS } from '../data/frenchWords';
describe('French predictor', () => {
  it.each(['', 'm', 'me', 'qu', 'je vais prendre le mét', 'zzq', 'bonjour ', 'é'])('ranks unique, finite predictions for %j', text => {
    const predictions = predictNextCharacters(text);
    expect(predictTop5(text)).toHaveLength(5);
    expect(new Set(predictions.map(p => p.char)).size).toBe(predictions.length);
    expect(predictions.every(p => Number.isFinite(p.score) && p.score > 0)).toBe(true);
    expect(predictions.map(p => p.score)).toEqual(predictions.map(p => p.score).sort((a, b) => b - a));
    expect(predictions.reduce((sum, p) => sum + p.probability, 0)).toBeCloseTo(1);
    expect(predictNextCharacters(text)).toEqual(predictions);
  });
  it('backs off from trigram to bigram to frequencies', () => {
    expect(getNgramDistribution('qu').source).toBe('trigram');
    expect(getNgramDistribution('ωm').source).toBe('bigram');
    expect(getNgramDistribution('☃').source).toBe('bigram'); // new word starts
    expect(getNgramDistribution('ω').source).toBe('frequency');
  });
  it.each([
    ['je vais prendre le mét', 'mét'], ["l'école", 'école'], ['l’école', 'école'],
    ['ARC-EN-CIEL', 'ciel'], ['bonjour ', ''], ['salut.', ''], ['', ''], ['ME\u0301T', 'mét'],
  ])('extracts the prefix of %j', (text, prefix) => expect(getCurrentPrefix(text)).toBe(prefix));
  it('preserves accents and canonical equivalents', () => {
    expect(predictTop5('me\u0301t')).toEqual(predictTop5('mét'));
    expect(dictionaryDistribution('mét')).toMatchObject({ r: expect.any(Number), i: expect.any(Number), h: expect.any(Number), a: expect.any(Number), é: expect.any(Number) });
    expect(dictionaryDistribution('met')).not.toEqual(dictionaryDistribution('mét'));
  });
  it('has several hundred curated words and favors e after qu', () => {
    expect(FRENCH_WORDS.length).toBeGreaterThan(500);
    expect(predictTop5('qu')[0].char).toBe('e');
  });
  it('exposes additive weighted contributions', () => {
    for (const p of predictTop5('mét')) expect(p.score).toBeCloseTo(p.contributions.ngram + p.contributions.dictionary + p.contributions.frequency);
  });
});
