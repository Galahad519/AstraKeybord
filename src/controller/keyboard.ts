import { predictTop5 } from '../engine/predictor';
import { emptyMetrics } from '../utils/metrics';
import type { InputSource, KeyboardMetrics, Position } from '../utils/metrics';
export const TEST_PHRASE = 'Le soleil se couchait doucement derrière les immeubles de Paris.';
export interface Session {
  text: string; mode: 'free' | 'test'; target: string; metrics: KeyboardMetrics;
  secondaryOpen: boolean; shift: boolean | null; completed: boolean; mistakes: boolean[];
  history: { context: string; predictions: string[]; selected: string }[];
}
export const createSession = (mode: Session['mode'] = 'free', target = TEST_PHRASE): Session => ({
  text: '', mode, target, metrics: emptyMetrics(), secondaryOpen: false, shift: null,
  completed: false, mistakes: [], history: [],
});
export const isUppercase = (state: Session) => state.shift ?? /(^|[.!?]\s*)$/.test(state.text);
export type Action =
  | { type: 'insert'; char: string; source: InputSource; position?: Position; now: number }
  | { type: 'backspace'; now: number }
  | { type: 'open-fallback' | 'close-fallback' | 'shift' }
  | { type: 'distance'; pixels: number }
  | { type: 'finish'; now: number }
  | { type: 'reset'; mode?: Session['mode'] };
export function keyboardReducer(state: Session, action: Action): Session {
  if (action.type === 'reset') return createSession(action.mode ?? state.mode, state.target);
  if (state.completed) return state;
  switch (action.type) {
    case 'insert': {
      if (Array.from(action.char.normalize('NFC')).length !== 1) return state;
      const raw = action.char.normalize('NFC');
      const char = isUppercase(state) ? raw.toLocaleUpperCase('fr') : raw;
      const predictions = predictTop5(state.text);
      const letter = /\p{L}/u.test(char);
      // A fallback selection is a miss by protocol, even if a proposed letter was chosen there.
      const hit = letter && action.source !== 'fallback' && predictions.some(p => p.char === char.toLocaleLowerCase('fr'));
      const wrong = state.mode === 'test' && char !== Array.from(state.target)[Array.from(state.text).length];
      const text = state.text + char;
      const complete = state.mode === 'test' && text === state.target;
      const metrics = { ...state.metrics,
        charactersTyped: state.metrics.charactersTyped + 1,
        errors: state.metrics.errors + Number(wrong),
        startedAt: state.metrics.startedAt ?? action.now,
        endedAt: complete ? action.now : null,
        letterSelections: state.metrics.letterSelections + Number(letter),
        top5Hits: state.metrics.top5Hits + Number(hit),
        fallbackSelections: state.metrics.fallbackSelections + Number(action.source === 'fallback'),
        positions: { ...state.metrics.positions },
      };
      if (action.position) metrics.positions[action.position]++;
      return { ...state, text, metrics, completed: complete, secondaryOpen: false, shift: null,
        mistakes: [...state.mistakes, wrong],
        history: [...state.history, { context: state.text.slice(-32), predictions: predictions.map(p => p.char), selected: char }].slice(-10) };
    }
    case 'backspace': {
      const wrong = state.mistakes.at(-1) ?? false;
      return { ...state, text: Array.from(state.text).slice(0, -1).join(''), mistakes: state.mistakes.slice(0, -1),
        metrics: { ...state.metrics, backspaces: state.metrics.backspaces + 1,
          correctedErrors: state.metrics.correctedErrors + Number(wrong) } };
    }
    case 'open-fallback': return state.secondaryOpen ? state : { ...state, secondaryOpen: true,
      metrics: { ...state.metrics, fallbackOpenings: state.metrics.fallbackOpenings + 1 } };
    case 'close-fallback': return { ...state, secondaryOpen: false };
    case 'shift': return { ...state, shift: !isUppercase(state) };
    case 'distance': return { ...state, metrics: { ...state.metrics, pointerDistance: state.metrics.pointerDistance + Math.max(0, action.pixels) } };
    case 'finish': return state.metrics.startedAt === null ? state : { ...state, completed: true, secondaryOpen: false,
      metrics: { ...state.metrics, endedAt: action.now } };
  }
}
