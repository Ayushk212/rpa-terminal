// useRowInspector — owns inspector open/close state
// Traps addressed:
//  - Trap 4: stores a shallow copy ({ ...rowData }) at click time, not a live pointer
//  - Trap 5: auto-closes when isPaused flips false
//  - Trap 7: Esc listener managed here, not in the panel

import { useState, useEffect, useCallback } from 'react';

export function useRowInspector(isPaused) {
  const [state, setState] = useState({ open: false, row: null });

  const openInspector = useCallback((rowData) => {
    setState({ open: true, row: { ...rowData } }); // Trap 4: snapshot, not live pointer
  }, []);

  const closeInspector = useCallback(() => {
    setState({ open: false, row: null });
  }, []);

  // Trap 5: auto-close when stream resumes
  useEffect(() => {
    if (!isPaused && state.open) closeInspector();
  }, [isPaused, state.open, closeInspector]);

  // Trap 7: Esc to close
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeInspector(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, closeInspector]);

  return { ...state, openInspector, closeInspector };
}
