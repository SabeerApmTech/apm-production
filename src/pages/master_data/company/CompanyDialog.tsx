import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { CompanyRecord } from "@/types/company"

interface CompanyDialogProps {
  open: boolean
  onClose: () => void
  company?: CompanyRecord
  onAdd: (company: { companyCode: string; companyName: string; location: string }) => Promise<void>
  onEdit?: (companyId: number, companyCode: string, companyName: string, location: string) => Promise<void>
}

export function CompanyDialog({
  open,
  onClose,
  company,
  onAdd,
  onEdit,
}: CompanyDialogProps) {
  const isEdit = Boolean(company)

  const [companyCode, setCompanyCode] = React.useState(company?.companyCode ?? "")
  const [companyName, setCompanyName] = React.useState(company?.companyName ?? "")
  const [location, setLocation]       = React.useState(company?.location ?? "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form fields whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCompanyCode(company?.companyCode ?? "")
      setCompanyName(company?.companyName ?? "")
      setLocation(company?.location ?? "")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!companyCode.trim() || !companyName.trim() || !location.trim()) return
    setIsSubmitting(true)
    try {
      if (isEdit && company) {
        await onEdit?.(company.companyId, companyCode.trim(), companyName.trim(), location.trim())
      } else {
        await onAdd({ companyCode: companyCode.trim(), companyName: companyName.trim(), location: location.trim() })
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
      submitDisabled={isSubmitting || !companyCode.trim() || !companyName.trim() || !location.trim()}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyCode">Company Code</Label>
        <Input
          id="companyCode"
          placeholder="Enter company code"
          value={companyCode}
          onChange={(e) => setCompanyCode(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          placeholder="Enter company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
    </FormDialog>
  )
}
