import { useCallback, useMemo, useState } from "react"

export interface DialogState<T> {
  isOpen: boolean
  editing: T | undefined
  openAdd: () => void
  openEdit: (row: T) => void
  close: () => void
}

// Consolidates the "dialogOpen + editRow" pair repeated across master-data pages: adding
// opens the dialog with no row selected, editing opens it with one, and both share one
// close path. `isOpen` is derived so callers never have to keep the two halves in sync.
export function useDialogState<T>(): DialogState<T> {
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<T | undefined>(undefined)

  const openAdd = useCallback(() => {
    setEditing(undefined)
    setIsAdding(true)
  }, [])

  const openEdit = useCallback((row: T) => {
    setIsAdding(false)
    setEditing(row)
  }, [])

  const close = useCallback(() => {
    setIsAdding(false)
    setEditing(undefined)
  }, [])

  // Memoized so callers can depend on `dialog` as a whole (e.g. in a useCallback array)
  // without it changing identity — and therefore invalidating that callback — every render.
  return useMemo(
    () => ({ isOpen: isAdding || editing !== undefined, editing, openAdd, openEdit, close }),
    [isAdding, editing, openAdd, openEdit, close]
  )
}
