import type { ICellRendererParams } from "ag-grid-community"

export function ReadyToMoveCell({ value }: ICellRendererParams) {
  return <span className="font-semibold text-green-600">{value}</span>
}
