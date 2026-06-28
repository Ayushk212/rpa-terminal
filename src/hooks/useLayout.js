// useLayout — Feature 6: Panel visibility with localStorage persistence
// Hard refresh preserves exact widget visibility states

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'rpa_terminal_layout_v1';

const DEFAULT_LAYOUT = {
  kpiStrip:       true,
  gridWindow:     true,
  deptChart:      true,
  infraToggles:   true,
  replayBar:      true,
};

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useLayout() {
  const [layout, setLayout] = useState(loadLayout);

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch {}
  }, [layout]);

  const togglePanel = useCallback((key) => {
    setLayout(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  return { layout, togglePanel, resetLayout };
}
