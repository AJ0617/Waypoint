import { useCallback, useReducer } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type HistoryAction<T> =
  | { type: 'commit'; value: T }
  | { type: 'commitFrom'; baseline: T; value: T }
  | { type: 'replace'; value: T }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 100;

function reducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'commit': {
      const past = [...state.past, state.present].slice(-MAX_HISTORY);
      return { past, present: action.value, future: [] };
    }
    case 'commitFrom': {
      // Pushes an explicit baseline (captured before a run of `replace` calls, e.g. a drag
      // gesture's live preview) rather than the current `state.present`, which has already
      // diverged from that baseline via `replace`.
      const past = [...state.past, action.baseline].slice(-MAX_HISTORY);
      return { past, present: action.value, future: [] };
    }
    case 'replace':
      return { ...state, present: action.value };
    case 'undo': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
  }
}

/**
 * Undo/redo wrapper around a single value. `commit(next)` pushes a history entry (use for
 * discrete edits: add/delete/value change, drag-end). `replace(next)` swaps the present value
 * without pushing history (use for continuous/live updates like an in-progress drag).
 */
export function useHistoryState<T>(initial: T) {
  const [state, dispatch] = useReducer(reducer<T>, { past: [], present: initial, future: [] });

  const commit = useCallback((value: T) => dispatch({ type: 'commit', value }), []);
  const commitFrom = useCallback((baseline: T, value: T) => dispatch({ type: 'commitFrom', baseline, value }), []);
  const replace = useCallback((value: T) => dispatch({ type: 'replace', value }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    present: state.present,
    commit,
    commitFrom,
    replace,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
