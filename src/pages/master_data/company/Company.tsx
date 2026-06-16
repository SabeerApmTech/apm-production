import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { CompanyDialog } from "./CompanyDialog"

/* ── Types ─────────────────────────────────────────────── */
export interface CompanyRow {
  id: number
  companyName: string
  location: string
}

/* ── Mock data ──────────────────────────────────────────── */
const initialCompanies: CompanyRow[] = [
  { id: 1, companyName: "Lakshika",   location: "Chennai" },
  { id: 2, companyName: "Kingstrack", location: "Chennai" },
  { id: 3, companyName: "ABC",        location: "Chennai" },
]

/* ── Action cell ────────────────────────────────────────── */
interface ActionCellParams extends ICellRendererParams<CompanyRow> {
  onEdit?: (id: number) => void
}

function ActionCell({ data, onEdit }: ActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function Company() {
  const [companies, setCompanies]     = useState<CompanyRow[]>(initialCompanies)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editCompany, setEditCompany] = useState<CompanyRow | undefined>()

  const openEditDialog = useCallback((id: number) => {
    setEditCompany(companies.find((c) => c.id === id))
  }, [companies])

  const handleDelete = useCallback((rows: CompanyRow[]) => {
    const ids = new Set(rows.map((r) => r.id))
    setCompanies((prev) => prev.filter((c) => !ids.has(c.id)))
  }, [])

  const handleAdd = useCallback((company: Omit<CompanyRow, "id">) => {
    setCompanies((prev) => [
      ...prev,
      { ...company, id: Math.max(0, ...prev.map((c) => c.id)) + 1 },
    ])
  }, [])

  const handleEdit = useCallback((id: number, companyName: string, location: string) => {
    setCompanies((prev) =>
      prev.map((c) => c.id === id ? { ...c, companyName, location } : c)
    )
  }, [])

  const columnDefs = useMemo<ColDef<CompanyRow>[]>(
    () => [
      { field: "companyName", headerName: "Company Name", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { field: "location",    headerName: "Location" },
      { headerName: "Action", cellRenderer: ActionCell, cellRendererParams: { onEdit: openEditDialog }, sortable: false, maxWidth: 80 },
    ],
    [openEditDialog]
  )

  return (
    <>
      <DataTable<CompanyRow>
        title="Company"
        rowData={companies}
        columnDefs={columnDefs}
        onAdd={() => setDialogOpen(true)}
        onDelete={handleDelete}
        checkbox
      />

      <CompanyDialog
        key={editCompany?.id ?? "new"}
        open={dialogOpen || editCompany !== undefined}
        onClose={() => { setDialogOpen(false); setEditCompany(undefined) }}
        company={editCompany}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />
    </>
  )
}
