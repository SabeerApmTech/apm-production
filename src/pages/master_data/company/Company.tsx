import { useState, useCallback, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { CompanyDialog } from "./CompanyDialog"
import { useDialogState } from "@/hooks/useDialogState"
import { EditActionCell } from "@/shared/renderers"
import type { CompanyRecord } from "@/types/company"
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompaniesMutation,
} from "@/store/services/companyApi"

/* ── Page ───────────────────────────────────────────────── */
export function Company() {
  const { data, isLoading, isFetching, refetch } = useGetCompaniesQuery()
  const companies = data ?? []

  const [createCompany] = useCreateCompanyMutation()
  const [updateCompany] = useUpdateCompanyMutation()
  const [deleteCompanies] = useDeleteCompaniesMutation()

  const dialog = useDialogState<CompanyRecord>()
  const [deleteRows, setDeleteRows] = useState<CompanyRecord[] | null>(null)

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
      { headerName: "Action", cellRenderer: EditActionCell, cellRendererParams: { onEdit: dialog.openEdit }, sortable: false, maxWidth: 80 },
    ],
    [dialog]
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
        onAdd={dialog.openAdd}
        onDelete={setDeleteRows}
        checkbox
      />

      <CompanyDialog
        key={dialog.editing?.companyId ?? "new"}
        open={dialog.isOpen}
        onClose={dialog.close}
        company={dialog.editing}
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
