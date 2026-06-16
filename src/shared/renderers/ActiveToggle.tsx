import { useState } from "react"
import type { ICellRendererParams } from "ag-grid-community"
import { Switch } from "@/components/ui/switch"

export function ActiveToggle({ value }: ICellRendererParams) {
  const [checked, setChecked] = useState<boolean>(!!value)
  return <Switch checked={checked} onCheckedChange={setChecked} />
}
