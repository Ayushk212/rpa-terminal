// useStream — raw ingestion from window.RPAStream
// dataStream.js is loaded eagerly via index.html before React boots.

import { useEffect, useRef } from 'react';

export function useStream(onChunk) {
  // Keep ref updated via effect (safe in Strict Mode double-invoke)
  const onChunkRef = useRef(onChunk);
  useEffect(() => {
    onChunkRef.current = onChunk;
  });

  useEffect(() => {
    const rpa = window.RPAStream;
    if (!rpa) {
      console.warn('[useStream] window.RPAStream not found');
      return;
    }

    // Baseline load
    const baseline = rpa.getBaseline();
    if (typeof onChunkRef.current === 'function') {
      onChunkRef.current(baseline, true);
    }

    // Live tick subscription
    const unsub = rpa.subscribe((rows) => {
      if (typeof onChunkRef.current === 'function') {
        onChunkRef.current(rows, false);
      }
    });

    rpa.start();

    return () => {
      unsub();
      rpa.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
