import * as React from "react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { LOCATION_TYPES, INDIAN_STATES, type LocationType } from "@/shared/constants"

interface StateFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Two-tier picker: "Common" or "State" — picking "State" reveals a second select of Indian states.
 *  Emits a single string value: "Common", or the chosen state name. */
export function StateField({ value, onChange, disabled }: StateFieldProps) {
  const [locationType, setLocationType] = React.useState<LocationType>(
    INDIAN_STATES.includes(value as (typeof INDIAN_STATES)[number]) ? "State" : "Common"
  )

  // "Common" renders pre-selected for a blank value, but nothing has told the form that yet —
  // sync it once so submitting without touching this field doesn't fail validation against "".
  React.useEffect(() => {
    if (!value && locationType === "Common") onChange("Common")
  }, [value, locationType, onChange])

  function handleTypeChange(type: LocationType) {
    setLocationType(type)
    onChange(type === "Common" ? "Common" : "")
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={locationType} onValueChange={handleTypeChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
        <SelectContent>
          {LOCATION_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {locationType === "State" && (
        <Select value={value === "Common" ? "" : value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
