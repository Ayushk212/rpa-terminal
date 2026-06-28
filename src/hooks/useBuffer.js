// useBuffer — Feature 5: Pause/Play pipeline buffer
// When paused: captures chunks into a ref (no state = no renders)
// When unpaused: flushes accumulated queue in one batched commit

import { useRef, useState, useCallback } from 'react';

export function useBuffer(onFlush) {
  const [paused, setPaused] = useState(false);
  const pausedRef    = useRef(false);
  const queueRef     = useRef([]);   // accumulates while paused
  const onFlushRef   = useRef(onFlush);

  // Keep flush callback fresh
  onFlushRef.current = onFlush;

  const ingest = useCallback((rows, isBaseline) => {
    if (isBaseline) {
      onFlushRef.current(rows, isBaseline);
      return;
    }
    if (pausedRef.current) {
      // Silently capture — no state update, no re-render
      queueRef.current.push(...rows);
    } else {
      onFlushRef.current(rows, false);
    }
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
  }, []);

  const play = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    // Flush entire queue in one shot
    if (queueRef.current.length > 0) {
      const flushed = queueRef.current.splice(0);
      onFlushRef.current(flushed, false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (pausedRef.current) play(); else pause();
  }, [pause, play]);

  return { paused, toggle, pause, play, queueLength: () => queueRef.current.length };
}
