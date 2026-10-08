import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Position } from '../utils/metrics';
export const SWIPE_THRESHOLD = 28;
export function direction(dx: number, dy: number): Position | null {
  if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'droite' : 'gauche') : (dy > 0 ? 'bas' : 'haut');
}
export function useKeyboardGesture(select: (position: Position) => void, disabled: boolean) {
  const gesture = useRef<{ id: number; x: number; y: number; start: Position; moved: boolean } | null>(null);
  const [active, setActive] = useState<Position | null>(null);
  const cancel = () => { gesture.current = null; setActive(null); };
  function update(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return null;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    const displacement = Math.hypot(dx, dy);
    g.moved ||= displacement >= SWIPE_THRESHOLD;
    // Returning inside the dead zone after a swipe cancels it; small jitter remains a tap.
    const position = g.start === 'centre' ? (direction(dx, dy) ?? (g.moved ? null : 'centre'))
      : (displacement < SWIPE_THRESHOLD && !g.moved ? g.start : null);
    setActive(position);
    return position;
  }
  return { active, handlers: {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-position]');
      if (!button) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
        start: button.dataset.position as Position, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
      setActive(gesture.current.start);
    },
    onPointerMove: update,
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      if (gesture.current?.id !== event.pointerId) return;
      const position = update(event);
      cancel();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (position && !disabled) select(position);
    },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
  } };
}
