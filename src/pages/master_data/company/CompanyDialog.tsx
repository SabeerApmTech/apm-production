import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { CompanyRow } from "./Company"

interface CompanyDialogProps {
  open: boolean
  onClose: () => void
  company?: CompanyRow
  onAdd: (company: Omit<CompanyRow, "id">) => void
  onEdit?: (id: number, companyName: string, location: string) => void
}

export function CompanyDialog({
  open,
  onClose,
  company,
  onAdd,
  onEdit,
}: CompanyDialogProps) {
  const isEdit = Boolean(company)

  const [companyName, setCompanyName] = React.useState(company?.companyName ?? "")
  const [location, setLocation]       = React.useState(company?.location ?? "")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!companyName.trim() || !location.trim()) return
    if (isEdit && company) {
      onEdit?.(company.id, companyName.trim(), location.trim())
    } else {
      onAdd({ companyName: companyName.trim(), location: location.trim() })
    }
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Company" : "Add Company"}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Save"}
      submitDisabled={!companyName.trim() || !location.trim()}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          placeholder="Enter company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Company Location</Label>
        <Input
          id="location"
          placeholder="Enter company location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
    </FormDialog>
  )
}
