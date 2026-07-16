import { useState, type Dispatch, type SetStateAction } from "react"

// Mirrors `source` (e.g. an RTK Query result) into local state that the caller can then edit
// freely — for optimistic reordering, staged edits, etc. — resetting back in sync whenever
// `source` itself changes (a refetch, a different query arg). Comparing during render (not in
// an effect) means the reset lands in the same render as the new `source`, with no stale-state
// flash on the frame in between.
//
// `source` must be referentially stable across renders when it hasn't conceptually changed —
// e.g. pass a module-level `EMPTY_X = []` fallback, never an inline `data ?? []` literal (that
// allocates a new array every render while `data` is still undefined, which looks like a new
// source on every render and re-renders forever).
export function useSyncedState<T>(source: T): [T, Dispatch<SetStateAction<T>>] {
  const [prevSource, setPrevSource] = useState(source)
  const [state, setState] = useState(source)
  if (source !== prevSource) {
    setPrevSource(source)
    setState(source)
  }
  return [state, setState]
}
