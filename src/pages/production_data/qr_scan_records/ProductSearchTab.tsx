import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterSelect, ALL_FILTER_VALUE as ALL } from "@/shared/FilterSelect"
import { LoadingRow } from "@/shared/LoadingRow"
import { useGetProducedProductsQuery } from "@/store/services/operationQrScanApi"
import { useGetIdentifiersQuery } from "@/store/services/productApi"
import type { ProducedProductRecord } from "@/types/qrScanRecords"
import { formatLogDateTime } from "@/utils/date"

function ProductCard({ record }: { record: ProducedProductRecord }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="truncate text-sm font-semibold text-foreground">{record.uniqueIdentifier}</p>
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          {record.uniqueIdentifierName}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Product</dt>
        <dd className="text-right font-medium text-foreground">{record.productName}</dd>
        <dt className="text-muted-foreground">Company</dt>
        <dd className="text-right font-medium text-foreground">{record.companyName}</dd>
        <dt className="text-muted-foreground">Operation</dt>
        <dd className="text-right font-medium text-foreground">{record.operationName}</dd>
        <dt className="text-muted-foreground">Batch No</dt>
        <dd className="text-right font-medium text-foreground">{record.batchNumber}</dd>
        <dt className="text-muted-foreground">Employee</dt>
        <dd className="text-right font-medium text-foreground">
          {record.employeeId} : {record.employeeName}
        </dd>
        <dt className="text-muted-foreground">Scanned At</dt>
        <dd className="whitespace-pre-line text-right font-medium text-foreground">{formatLogDateTime(record.scannedAt)}</dd>
      </dl>
    </div>
  )
}

export function ProductSearchTab() {
  const [identifierName, setIdentifierName] = useState(ALL)
  const [searchText, setSearchText] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [appliedIdentifier, setAppliedIdentifier] = useState(ALL)
  const [appliedSearch, setAppliedSearch] = useState("")

  // Endpoint takes no filter params — nothing is fetched until Submit, then every filter below
  // is applied client-side over that one full result set.
  const { data, isFetching } = useGetProducedProductsQuery(undefined, { skip: !hasSubmitted })
  const records = useMemo(() => data?.records ?? [], [data])

  // The dropdown's options come from the master identifier list (available immediately), not from
  // the scanned-products records — those aren't fetched until Submit, which would otherwise leave
  // only "All Identifiers" selectable on the very first search.
  const { data: identifiers } = useGetIdentifiersQuery()
  const identifierOptions = identifiers ?? []

  function handleSubmit() {
    setHasSubmitted(true)
    setAppliedIdentifier(identifierName)
    setAppliedSearch(searchText.trim())
  }

  const results = useMemo(() => {
    if (!hasSubmitted) return []
    const search = appliedSearch.toLowerCase()
    return records.filter(
      (r) =>
        (appliedIdentifier === ALL || r.uniqueIdentifierName === appliedIdentifier) &&
        (!search || r.uniqueIdentifier.toLowerCase().includes(search))
    )
  }, [records, hasSubmitted, appliedIdentifier, appliedSearch])

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Identifier"
            value={identifierName}
            onValueChange={setIdentifierName}
            allLabel="All Identifiers"
            options={identifierOptions.map((i) => ({ value: i.identifierName, label: i.identifierName }))}
          />

          <div className="flex w-64 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
                placeholder="Search by identifier..."
                className="pl-9"
              />
            </div>
          </div>

          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isFetching ? (
          <LoadingRow label="Searching…" size="md" className="justify-center py-16 text-muted-foreground" />
        ) : !hasSubmitted ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Choose an identifier and/or type a search value, then click Submit.
          </div>
        ) : !results.length ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No scanned products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <ProductCard key={r.qrScanId} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
