import { useRef } from 'react';
import type { PointerEvent } from 'react';
export function usePointerDistance(add: (pixels: number) => void) {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  const start = (event: PointerEvent) => {
    if (event.isPrimary) last.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const move = (event: PointerEvent) => {
    if (!event.isPrimary) return;
    const points = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const point of points.length ? points : [event]) {
      const previous = last.current;
      if (previous?.id === event.pointerId) add(Math.hypot(point.clientX - previous.x, point.clientY - previous.y));
      last.current = { id: event.pointerId, x: point.clientX, y: point.clientY };
    }
  };
  return { onPointerEnter: start, onPointerDownCapture: start, onPointerMoveCapture: move,
    onPointerUpCapture(event: PointerEvent) { move(event); if (event.pointerType !== 'mouse') last.current = null; },
    onPointerLeave() { last.current = null; }, onPointerCancelCapture() { last.current = null; } };
}
