import type { ICellRendererParams } from "ag-grid-community"
import { Switch } from "@/components/ui/switch"

interface ActiveToggleParams extends ICellRendererParams {
  onToggle?: (data: unknown, next: boolean) => void
  /** usersId of the row currently being toggled, if any — disables just that row's switch. */
  pendingId?: number | null
}

export function ActiveToggle({ value, data, onToggle, pendingId }: ActiveToggleParams) {
  const rowId = (data as { usersId?: number } | undefined)?.usersId
  const pending = pendingId != null && pendingId === rowId

  return (
    <Switch
      checked={!!value}
      disabled={pending || !onToggle}
      onCheckedChange={(next) => onToggle?.(data, next)}
    />
  )
}
