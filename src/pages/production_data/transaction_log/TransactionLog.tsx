import { useCallback, useMemo, useState } from "react"
import type { ColDef, ValueFormatterParams, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { StatusCell } from "@/shared/StatusCell"
import { DeleteCell } from "@/shared/renderers/DeleteCell"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { formatLogDateTime, getMonthEndIso, getMonthStartIso } from "@/utils/date"
import { getAuthUser } from "@/utils/auth"
import { useDateRange } from "@/hooks/useDateRange"
import type { TransactionLogRecord } from "@/types/transactionLog"
import {
  useGetTransactionLogsQuery,
  useDeleteTransactionLogMutation,
} from "@/store/services/transactionLogApi"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetProductsQuery, useGetOperationsQuery } from "@/store/services/productApi"

export function TransactionLog() {
  const dateRange = useDateRange()
  const [companyName, setCompanyName] = useState(ALL)
  const [productId, setProductId] = useState(ALL)
  const [operationName, setOperationName] = useState(ALL)

  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetProductsQuery()
  const { data: operations } = useGetOperationsQuery(
    { productId: Number(productId), operationType: "production" },
    { skip: productId === ALL }
  )

  // The API has no product-id filter param — resolve the selected id back to its name for the
  // real server-side `productName` filter.
  const selectedProductName = useMemo(
    () => (productId === ALL ? undefined : products?.find((p) => String(p.productId) === productId)?.productName),
    [products, productId]
  )

  const { data, isLoading, isFetching, refetch } = useGetTransactionLogsQuery({
    fromDate: dateRange.from,
    toDate: dateRange.to,
    companyName: companyName === ALL ? undefined : companyName,
    productName: selectedProductName,
  })

  // There's no company-product master mapping in this app — logs are the only place that link
  // the two — so derive each dropdown's options from logs scoped by the *other* filter alone.
  const { data: companyLogs } = useGetTransactionLogsQuery(
    { fromDate: dateRange.from, toDate: dateRange.to, companyName: companyName === ALL ? undefined : companyName },
    { skip: companyName === ALL }
  )
  const { data: productLogs } = useGetTransactionLogsQuery(
    { fromDate: dateRange.from, toDate: dateRange.to, productName: selectedProductName },
    { skip: productId === ALL }
  )

  const productOptions = useMemo(() => {
    if (companyName === ALL) return products ?? []
    const namesForCompany = new Set((companyLogs ?? []).map((r) => r.productName))
    return (products ?? []).filter((p) => namesForCompany.has(p.productName))
  }, [products, companyName, companyLogs])

  const companyOptions = useMemo(() => {
    if (productId === ALL) return companies ?? []
    const namesForProduct = new Set((productLogs ?? []).map((r) => r.companyName))
    return (companies ?? []).filter((c) => namesForProduct.has(c.companyName))
  }, [companies, productId, productLogs])

  // The API has no operation filter param — filter client-side by the selected operation's name.
  const rows = useMemo(() => {
    const all = data ?? []
    return operationName === ALL ? all : all.filter((r) => r.operationName === operationName)
  }, [data, operationName])

  // Company and Product mutually narrow each other's dropdown options above, so neither can end
  // up pointing at a combination the other doesn't have — only Operation (a one-way dependent
  // of Product, not narrowed itself) needs an explicit reset here.
  function handleProductChange(value: string) {
    setProductId(value)
    setOperationName(ALL)
  }

  const [deleteTransactionLog] = useDeleteTransactionLogMutation()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Managers can't delete transaction log entries.
  const canDelete = getAuthUser()?.employeeRole !== "MANAGER"

  const closeDelete = useCallback(() => setDeleteId(null), [])
  const openDelete  = useCallback((id: number) => setDeleteId(id), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    const user = getAuthUser()
    if (!user) return
    try {
      await deleteTransactionLog({ transactionId: deleteId, deletedByEmpId: user.employeeId }).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deleteTransactionLog])

  const columnDefs = useMemo<ColDef<TransactionLogRecord>[]>(() => {
    const baseColumns: ColDef<TransactionLogRecord>[] = [
      {
        field: "logTime",
        headerName: "Date & Time",
        minWidth: 130,
        cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" },
        valueFormatter: (p: ValueFormatterParams<TransactionLogRecord>) =>
          p.value ? formatLogDateTime(p.value) : "",
      },
      {
        headerName: "Employee",
        valueGetter: (p: ValueGetterParams<TransactionLogRecord>) =>
          p.data ? `${p.data.employeeId} : ${p.data.employeeName}` : "",
        minWidth: 150,
      },
      { field: "scheduleId",    headerName: "Schedule ID",    minWidth: 110 },
      { field: "companyName",   headerName: "Company",        cellStyle: { fontWeight: 600 }, minWidth: 120 },
      { field: "productName",   headerName: "Product",        cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "sequenceNo",    headerName: "Seq No",         maxWidth: 90 },
      { field: "operationName", headerName: "Operation",      minWidth: 140 },
      { field: "status",        headerName: "Status",         cellRenderer: StatusCell, minWidth: 110 },
      { field: "logEvent",      headerName: "Event",          minWidth: 100 },
      { field: "successfulQty", headerName: "Successful Qty", minWidth: 130 },
      { field: "rejectedQty",   headerName: "Rejected Qty",   minWidth: 120 },
      { field: "reason",        headerName: "Reason",         minWidth: 140, valueFormatter: (p) => p.value ?? "-" },
      { field: "remarks",       headerName: "Remarks",        minWidth: 110, valueFormatter: (p) => p.value ?? "-" },
    ]
    if (!canDelete) return baseColumns
    return [
      {
        headerName: "Action",
        cellRenderer: DeleteCell,
        cellRendererParams: { onDelete: openDelete },
        sortable: false, maxWidth: 80,
      },
      ...baseColumns,
    ]
  }, [canDelete, openDelete])

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Company"
            value={companyName}
            onValueChange={setCompanyName}
            allLabel="All Companies"
            options={companyOptions.map((c) => ({ value: c.companyName, label: c.companyName }))}
          />

          <FilterSelect
            label="Product"
            value={productId}
            onValueChange={handleProductChange}
            allLabel="All Products"
            options={productOptions.map((p) => ({ value: String(p.productId), label: p.productName }))}
          />

          <FilterSelect
            label="Operation"
            value={operationName}
            onValueChange={setOperationName}
            allLabel="All Operations"
            options={(operations ?? []).map((op) => ({ value: op.operationName, label: op.operationName }))}
            disabled={productId === ALL}
          />
        </div>
      </div>

      <DataTable<TransactionLogRecord>
        title="Transaction Log"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        showDateFilter
        defaultFromDate={getMonthStartIso()}
        defaultToDate={getMonthEndIso()}
        onDateFilter={dateRange.setRange}
      />
      <DeleteDialog
        open={deleteId !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  )
}
