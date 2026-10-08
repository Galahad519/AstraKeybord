import { describe, expect, it } from 'vitest';
import { createSession, keyboardReducer } from './keyboard';
import { predictTop5 } from '../engine/predictor';
import { deriveMetrics, editDistance } from '../utils/metrics';
import { direction } from '../hooks/useKeyboardGesture';
describe('session and shared metrics', () => {
  it('counts top5 selections, misses and control characters independently', () => {
    let state = createSession();
    state = keyboardReducer(state, { type: 'insert', char: predictTop5('')[0].char, source: 'prediction', position: 'centre', now: 1000 });
    state = keyboardReducer(state, { type: 'open-fallback' });
    state = keyboardReducer(state, { type: 'insert', char: 'z', source: 'fallback', now: 2000 });
    state = keyboardReducer(state, { type: 'insert', char: ' ', source: 'control', now: 3000 });
    expect(state.secondaryOpen).toBe(false);
    expect(state.metrics).toMatchObject({ charactersTyped: 3, letterSelections: 2, top5Hits: 1, fallbackOpenings: 1, fallbackSelections: 1 });
    expect(deriveMetrics(state.metrics, 4000)).toMatchObject({ hitRate: 50, cpm: 60, duration: 3000 });
    expect(state.metrics.positions.centre).toBe(1);
  });
  it('does not count opening without selecting as a top5 miss', () => {
    let state = keyboardReducer(createSession(), { type: 'open-fallback' });
    state = keyboardReducer(state, { type: 'close-fallback' });
    expect(deriveMetrics(state.metrics, 9999).hitRate).toBeNull();
  });
  it('tracks actual corrections, freezes exact completion, resets cleanly', () => {
    let state = createSession('test', 'Ab.');
    state = keyboardReducer(state, { type: 'insert', char: 'z', source: 'fallback', now: 0 });
    state = keyboardReducer(state, { type: 'backspace', now: 500 });
    for (const [i, char] of Array.from('ab.').entries()) state = keyboardReducer(state, { type: 'insert', char, source: 'fallback', now: 1000 * (i + 1) });
    expect(state.text).toBe('Ab.'); expect(state.completed).toBe(true);
    expect(state.metrics).toMatchObject({ errors: 1, correctedErrors: 1, backspaces: 1, startedAt: 0, endedAt: 3000 });
    expect(deriveMetrics(state.metrics, 9999).duration).toBe(3000);
    expect(keyboardReducer(state, { type: 'distance', pixels: 500 })).toBe(state);
    expect(keyboardReducer(state, { type: 'reset' })).toEqual(createSession('test', 'Ab.'));
  });
  it('does not treat deletion of correct text as an error correction', () => {
    let state = createSession('test', 'A');
    state = keyboardReducer(state, { type: 'backspace', now: 0 });
    expect(state.metrics.correctedErrors).toBe(0);
    state = createSession('test', 'Ab');
    state = keyboardReducer(state, { type: 'insert', char: 'a', source: 'fallback', now: 10 });
    state = keyboardReducer(state, { type: 'backspace', now: 20 });
    expect(state.metrics.correctedErrors).toBe(0);
    expect(state.metrics.charactersTyped).toBe(1);
  });
  it('limits history and normalizes accented insertions', () => {
    let state = createSession();
    for (let i = 0; i < 15; i++) state = keyboardReducer(state, { type: 'insert', char: 'e\u0301', source: 'fallback', now: i });
    expect(state.history).toHaveLength(10); expect(state.text.startsWith('Éé')).toBe(true);
  });
  it('computes remaining edit errors', () => {
    expect(editDistance('abc', 'abc')).toBe(0); expect(editDistance('ac', 'abc')).toBe(1);
    expect(editDistance('axc', 'abc')).toBe(1); expect(editDistance('é', 'e\u0301')).toBe(0);
  });
  it('rejects jitter and maps directions at the threshold', () => {
    expect(direction(12, 12)).toBeNull(); expect(direction(28, 0)).toBe('droite');
    expect(direction(-40, 2)).toBe('gauche'); expect(direction(5, -30)).toBe('haut');
    expect(direction(1, 50)).toBe('bas');
  });
});
