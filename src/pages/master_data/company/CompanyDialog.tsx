import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { CompanyRecord } from "@/types/company"

interface CompanyDialogProps {
  open: boolean
  onClose: () => void
  company?: CompanyRecord
  onAdd: (company: { companyName: string; companyLocation: string }) => Promise<void>
  onEdit?: (companyId: number, companyName: string, companyLocation: string) => Promise<void>
}

export function CompanyDialog({
  open,
  onClose,
  company,
  onAdd,
  onEdit,
}: CompanyDialogProps) {
  const isEdit = Boolean(company)

  const [companyName, setCompanyName]         = React.useState(company?.companyName ?? "")
  const [companyLocation, setCompanyLocation] = React.useState(company?.companyLocation ?? "")
  const [isSubmitting, setIsSubmitting]       = React.useState(false)

  // Resets the form fields whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCompanyName(company?.companyName ?? "")
      setCompanyLocation(company?.companyLocation ?? "")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!companyName.trim() || !companyLocation.trim()) return
    setIsSubmitting(true)
    try {
      if (isEdit && company) {
        await onEdit?.(company.companyId, companyName.trim(), companyLocation.trim())
      } else {
        await onAdd({ companyName: companyName.trim(), companyLocation: companyLocation.trim() })
      }
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Company" : "Add Company"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !companyName.trim() || !companyLocation.trim()}
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
        <Label htmlFor="companyLocation">Company Location</Label>
        <Input
          id="companyLocation"
          placeholder="Enter company location"
          value={companyLocation}
          onChange={(e) => setCompanyLocation(e.target.value)}
        />
      </div>
    </FormDialog>
  )
}
