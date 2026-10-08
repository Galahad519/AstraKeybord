import type { Prediction } from '../engine/types';
import { POSITIONS } from '../utils/metrics';
import type { Position } from '../utils/metrics';
import { useKeyboardGesture } from '../hooks/useKeyboardGesture';
import { PredictiveKey } from './PredictiveKey';
interface Props { predictions: Prediction[]; uppercase: boolean; probabilities: boolean; disabled: boolean;
  onSelect: (position: Position) => void }
export function PredictiveKeyboard(props: Props) {
  const { active, handlers } = useKeyboardGesture(props.onSelect, props.disabled);
  return <div className="constellation" role="group" aria-label="Clavier prédictif à cinq directions" {...handlers}>
    <div className="orbit" aria-hidden="true"/><div className="axis axis-x" aria-hidden="true"/><div className="axis axis-y" aria-hidden="true"/>
    <span className="direction-mark mark-top" aria-hidden="true">↑</span><span className="direction-mark mark-bottom" aria-hidden="true">↓</span>
    <span className="direction-mark mark-left" aria-hidden="true">←</span><span className="direction-mark mark-right" aria-hidden="true">→</span>
    {POSITIONS.map((position, index) => <PredictiveKey key={position} position={position}
      prediction={props.predictions[index]} uppercase={props.uppercase} probabilities={props.probabilities}
      active={active === position} disabled={props.disabled} onSelect={() => props.onSelect(position)}/>)}
  </div>;
}
