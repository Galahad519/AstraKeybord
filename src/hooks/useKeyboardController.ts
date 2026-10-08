import { useEffect, useMemo, useReducer, useState } from 'react';
import { createSession, isUppercase, keyboardReducer } from '../controller/keyboard';
import { predictionEngine } from '../engine/predictor';
import { deriveMetrics } from '../utils/metrics';
export function useKeyboardController() {
  const [session, dispatch] = useReducer(keyboardReducer, undefined, () => createSession());
  const [now, setNow] = useState(performance.now());
  useEffect(() => {
    if (session.metrics.startedAt === null || session.completed) return;
    const timer = window.setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(timer);
  }, [session.metrics.startedAt, session.completed]);
  const predictions = useMemo(() => predictionEngine.predict(session.text).slice(0, 5), [session.text]);
  return { session, dispatch, predictions, uppercase: isUppercase(session),
    derived: deriveMetrics(session.metrics, Math.max(now, session.metrics.startedAt ?? now)) };
}
