import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Pencil } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { CompanyDialog } from "./CompanyDialog"
import type { CompanyRecord } from "@/types/company"
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompaniesMutation,
} from "@/store/services/companyApi"

/* ── Action cell ────────────────────────────────────────── */
interface ActionCellParams extends ICellRendererParams<CompanyRecord> {
  onEdit?: (id: number) => void
}

function ActionCell({ data, onEdit }: ActionCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.companyId) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function Company() {
  const { data, isLoading, isFetching, refetch } = useGetCompaniesQuery()
  const companies = useMemo(() => data ?? [], [data])

  const [createCompany] = useCreateCompanyMutation()
  const [updateCompany] = useUpdateCompanyMutation()
  const [deleteCompanies] = useDeleteCompaniesMutation()

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editCompany, setEditCompany] = useState<CompanyRecord | undefined>()
  const [deleteRows, setDeleteRows]   = useState<CompanyRecord[] | null>(null)

  const openEditDialog = useCallback((id: number) => {
    setEditCompany(companies.find((c) => c.companyId === id))
  }, [companies])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    try {
      await deleteCompanies(deleteRows.map((r) => r.companyId)).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteRows, deleteCompanies])

  const handleAdd = useCallback(async (company: { companyName: string; companyLocation: string }) => {
    await createCompany(company).unwrap()
  }, [createCompany])

  const handleEdit = useCallback(async (companyId: number, companyName: string, companyLocation: string) => {
    await updateCompany({ companyId, body: { companyName, companyLocation } }).unwrap()
  }, [updateCompany])

  const columnDefs = useMemo<ColDef<CompanyRecord>[]>(
    () => [
      { field: "companyName", headerName: "Company Name", cellStyle: { color: "#3b82f6", fontWeight: 500 } },
      { field: "companyLocation", headerName: "Location" },
      { headerName: "Action", cellRenderer: ActionCell, cellRendererParams: { onEdit: openEditDialog }, sortable: false, maxWidth: 80 },
    ],
    [openEditDialog]
  )

  return (
    <>
      <DataTable<CompanyRecord>
        title="Company"
        rowData={companies}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        onAdd={() => setDialogOpen(true)}
        onDelete={setDeleteRows}
        checkbox
      />

      <CompanyDialog
        key={editCompany?.companyId ?? "new"}
        open={dialogOpen || editCompany !== undefined}
        onClose={() => { setDialogOpen(false); setEditCompany(undefined) }}
        company={editCompany}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Company"
        description={`Are you sure you want to delete the selected compan${deleteRows && deleteRows.length > 1 ? "ies" : "y"}? This action cannot be undone.`}
      />
    </>
  )
}
