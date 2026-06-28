// src/hooks/useStream.js — REPLACE YOUR EXISTING FILE WITH THIS
// Fixed: StrictMode double-invoke + waits for 50k baseline to be ready

import { useEffect, useRef, useCallback } from 'react';

export function useStream(onChunk) {
  const cbRef        = useRef(onChunk);
  const mountedRef   = useRef(false);

  // Keep callback ref current on every render
  useEffect(() => { cbRef.current = onChunk; });

  useEffect(() => {
    const rpa = window.RPAStream;
    if (!rpa) {
      console.error('[useStream] window.RPAStream missing — check index.html has <script src="/dataStream.js"> before the React bundle');
      return;
    }

    mountedRef.current = true;

    function go() {
      if (!mountedRef.current) return;   // cleanup already ran — bail

      const rows = rpa.getBaseline();
      console.log('[useStream] ingesting', rows.length, 'baseline rows');
      cbRef.current && cbRef.current(rows, true);

      const unsub = rpa.subscribe(function(chunk) {
        if (mountedRef.current) cbRef.current && cbRef.current(chunk, false);
      });

      rpa.start();

      // stash cleanup so the return below can call it
      mountedRef._unsub = unsub;
    }

    // If baseline already built → go immediately; else wait for onReady
    if (rpa.isReady && rpa.isReady()) {
      go();
    } else if (rpa.onReady) {
      console.log('[useStream] waiting for 50k baseline...');
      rpa.onReady(go);
    } else {
      // Old dataStream.js fallback (no isReady/onReady): just call immediately
      go();
    }

    return function() {
      mountedRef.current = false;
      if (mountedRef._unsub) { mountedRef._unsub(); mountedRef._unsub = null; }
      rpa.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const injectBurst = useCallback((count = 5000) => {
    if (window.RPAStream && window.RPAStream.generateRows) {
      const rows = window.RPAStream.generateRows(count);
      cbRef.current && cbRef.current(rows, false);
    }
  }, []);

  return { injectBurst };
}
