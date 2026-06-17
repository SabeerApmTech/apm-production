import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { EMPLOYEES } from "./data"
import type { Employee } from "./types"

interface Props {
  onSubmit: (employee: Employee) => void
}

export function EmployeeSelect({ onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState("")
  const selected = EMPLOYEES.find(e => e.id === employeeId)

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 mb-3">Select Employee</p>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-full sm:w-64 bg-blue-50 border-blue-200 text-sm">
            <SelectValue placeholder="Select employee..." />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEES.map(e => (
              <SelectItem key={e.id} value={e.id} className="text-sm">
                {e.name}&nbsp;&nbsp;—&nbsp;&nbsp;{e.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => selected && onSubmit(selected)}
          disabled={!selected}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-7 h-9"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
