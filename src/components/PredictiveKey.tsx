import type { Prediction } from '../engine/types';
import type { Position } from '../utils/metrics';
interface Props { prediction: Prediction; position: Position; active: boolean; uppercase: boolean;
  probabilities: boolean; disabled: boolean; onSelect: () => void }
export function PredictiveKey({ prediction, position, active, uppercase, probabilities, disabled, onSelect }: Props) {
  const char = uppercase ? prediction.char.toLocaleUpperCase('fr') : prediction.char;
  return <button className={`predictive-key key-${position} ${active ? 'is-active' : ''}`}
    data-position={position} data-char={char} disabled={disabled}
    aria-label={`${position} : ${char}`} onClick={event => { if (event.detail === 0) onSelect(); }}>
    <span className="key-letter" key={char}>{char}</span>
    {probabilities && <span className="key-probability">{Math.round(prediction.probability * 100)} %</span>}
  </button>;
}
