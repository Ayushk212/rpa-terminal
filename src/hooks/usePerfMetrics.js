import { useState, useEffect, useRef } from 'react';

export function usePerfMetrics(gridRef, lastTickDurationRef) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    heapMB: 0,
    domNodeCount: 0,
    tickDurationMs: 0
  });

  const framesRef = useRef([]);
  const lastUpdateRef = useRef(performance.now());

  useEffect(() => {
    let animationFrameId;

    const loop = (timestamp) => {
      // 1. FPS Calculation: rolling 1-second window
      const now = performance.now();
      framesRef.current.push(now);
      
      // Prune frames older than 1 second (1000ms)
      while (framesRef.current.length > 0 && framesRef.current[0] <= now - 1000) {
        framesRef.current.shift();
      }

      // 2. Throttle state updates to ~250ms
      if (now - lastUpdateRef.current >= 250) {
        lastUpdateRef.current = now;

        const fps = framesRef.current.length;
        
        // Heap usage
        let heapMB = 0;
        if (performance && performance.memory && performance.memory.usedJSHeapSize) {
          heapMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }

        // DOM Node Count
        let domNodeCount = 0;
        if (gridRef && gridRef.current) {
          domNodeCount = gridRef.current.querySelectorAll('[data-row="true"]').length;
        }

        // Tick Duration
        const tickDurationMs = lastTickDurationRef && lastTickDurationRef.current 
          ? Math.round(lastTickDurationRef.current) 
          : 0;

        setMetrics({
          fps,
          heapMB,
          domNodeCount,
          tickDurationMs
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridRef, lastTickDurationRef]);

  return metrics;
}
