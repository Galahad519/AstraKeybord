export const POSITIONS = ['centre', 'haut', 'bas', 'gauche', 'droite'] as const;
export type Position = typeof POSITIONS[number];
export type InputSource = 'prediction' | 'fallback' | 'control' | 'azerty';
export interface KeyboardMetrics {
  charactersTyped: number; errors: number; correctedErrors: number; backspaces: number;
  fallbackOpenings: number; fallbackSelections: number; top5Hits: number; letterSelections: number;
  pointerDistance: number; startedAt: number | null; endedAt: number | null;
  positions: Record<Position, number>;
}
export function emptyMetrics(): KeyboardMetrics {
  return { charactersTyped: 0, errors: 0, correctedErrors: 0, backspaces: 0, fallbackOpenings: 0,
    fallbackSelections: 0, top5Hits: 0, letterSelections: 0, pointerDistance: 0,
    startedAt: null, endedAt: null, positions: { centre: 0, haut: 0, bas: 0, gauche: 0, droite: 0 } };
}
export function deriveMetrics(metrics: KeyboardMetrics, now: number) {
  const duration = metrics.startedAt === null ? 0 : Math.max(0, (metrics.endedAt ?? now) - metrics.startedAt);
  return { duration, cpm: duration > 0 ? metrics.charactersTyped * 60000 / duration : 0,
    hitRate: metrics.letterSelections ? 100 * metrics.top5Hits / metrics.letterSelections : null };
}
export function editDistance(actual: string, target: string): number {
  const a = Array.from(actual.normalize('NFC')), b = Array.from(target.normalize('NFC'));
  let row = b.map((_, i) => i + 1); row.unshift(0);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)));
    row = next;
  }
  return row[b.length];
}
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
