import { useMemo, useState } from "react"
import type { ColDef, ValueFormatterParams, ValueGetterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { useGetProducedProductsQuery } from "@/store/services/operationQrScanApi"
import type { ProducedProductRecord } from "@/types/qrScanRecords"
import { formatLogDateTime } from "@/utils/date"

export function ProducedProductsTab() {
  const [productName, setProductName] = useState(ALL)
  const [identifierName, setIdentifierName] = useState(ALL)
  const [employeeId, setEmployeeId] = useState(ALL)

  const { data, isLoading, isFetching, refetch } = useGetProducedProductsQuery()
  const records = useMemo(() => data?.records ?? [], [data])

  // No server-side filter params on this endpoint — derive each dropdown's options straight from
  // the fetched records and filter in-memory instead of round-tripping to the API per filter.
  const productOptions = useMemo(() => [...new Set(records.map((r) => r.productName))], [records])
  const identifierOptions = useMemo(() => [...new Set(records.map((r) => r.uniqueIdentifierName))], [records])
  const employeeOptions = useMemo(() => {
    const seen = new Set<string>()
    return records.filter((r) => {
      if (seen.has(r.employeeId)) return false
      seen.add(r.employeeId)
      return true
    })
  }, [records])

  const rows = useMemo(
    () =>
      records.filter(
        (r) =>
          (productName === ALL || r.productName === productName) &&
          (identifierName === ALL || r.uniqueIdentifierName === identifierName) &&
          (employeeId === ALL || r.employeeId === employeeId)
      ),
    [records, productName, identifierName, employeeId]
  )

  const columnDefs = useMemo<ColDef<ProducedProductRecord>[]>(() => {
    const columns: ColDef<ProducedProductRecord>[] = [
      { field: "scheduleId", headerName: "Schedule ID", minWidth: 110 },
      { field: "companyName", headerName: "Company", cellStyle: { fontWeight: 600 }, minWidth: 140 },
      { field: "companyLocation", headerName: "Location", minWidth: 120 },
      { field: "productName", headerName: "Product", cellStyle: { fontWeight: 600 }, minWidth: 130 },
      { field: "operationName", headerName: "Operation", minWidth: 130 },
      { field: "uniqueIdentifierName", headerName: "Identifier Name", minWidth: 140 },
      { field: "uniqueIdentifier", headerName: "Unique Identifier", minWidth: 150 },
      { field: "batchNumber", headerName: "Batch No", minWidth: 100 },
      {
        headerName: "Employee",
        valueGetter: (p: ValueGetterParams<ProducedProductRecord>) =>
          p.data ? `${p.data.employeeId} : ${p.data.employeeName}` : "",
        minWidth: 180,
      },
      {
        field: "scannedAt",
        headerName: "Scanned At",
        minWidth: 150,
        cellStyle: { whiteSpace: "pre-line", lineHeight: "1.4" },
        valueFormatter: (p: ValueFormatterParams<ProducedProductRecord>) => (p.value ? formatLogDateTime(p.value) : ""),
      },
    ]
    return columns
  }, [])

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Product"
            value={productName}
            onValueChange={setProductName}
            allLabel="All Products"
            options={productOptions.map((p) => ({ value: p, label: p }))}
          />

          <FilterSelect
            label="Identifier"
            value={identifierName}
            onValueChange={setIdentifierName}
            allLabel="All Identifiers"
            options={identifierOptions.map((i) => ({ value: i, label: i }))}
          />

          <FilterSelect
            label="Employee"
            value={employeeId}
            onValueChange={setEmployeeId}
            allLabel="All Employees"
            options={employeeOptions.map((o) => ({ value: o.employeeId, label: o.employeeName }))}
          />
        </div>
      </div>

      <DataTable<ProducedProductRecord>
        title="Produced Products"
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
      />
    </div>
  )
}
