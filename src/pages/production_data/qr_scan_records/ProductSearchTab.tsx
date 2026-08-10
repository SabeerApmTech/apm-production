import { useMemo, useState } from "react"
import { Clock, Layers, Search, User, Wrench } from "lucide-react"
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
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-foreground" title={record.uniqueIdentifier}>
            {record.uniqueIdentifier}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {record.productName} <span aria-hidden>·</span> {record.companyName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          {record.uniqueIdentifierName}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Wrench className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-foreground" title={record.operationName}>{record.operationName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">{record.employeeId} · {record.employeeName}</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" /> Batch {record.batchNumber}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Clock className="h-3 w-3" /> {formatLogDateTime(record.scannedAt).replace("\n", " ")}
        </span>
      </div>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <ProductCard key={r.qrScanId} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
