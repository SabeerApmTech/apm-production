import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { processTeamBadgeClasses } from "@/shared/processTeamBadge"
import { ScheduleSummaryTable } from "./ScheduleSummaryTable"
import type { Operation, Schedule } from "./types"
import type { IdentifierRecord } from "@/types/product"

interface Props {
  schedule: Schedule
  operations: Operation[]
  /** Used to resolve each operation's `identifierTypeId` to a display name. */
  identifiers?: IdentifierRecord[]
  onSelect: (operation: Operation) => Promise<void>
}

export function OperationCards({ schedule, operations, identifiers, onSelect }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleSelect = async (op: Operation) => {
    setLoadingId(op.operationId)
    try {
      await onSelect(op)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <ScheduleSummaryTable schedule={schedule} />
      <div className="overflow-y-auto max-h-[calc(100vh-18rem)] pr-0.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map(op => {
            const identifierName = identifiers?.find((i) => i.identifierTypeId === op.identifierTypeId)?.identifierName
            return (
            <div key={op.operationId} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-blue-200">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-gray-500">Step {op.sequenceNo}</p>
                  <p className="text-xs font-semibold text-[#1e3a5f] leading-snug">{op.operationName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {op.processTeam && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", processTeamBadgeClasses(op.processTeam))}>
                      {op.processTeam}
                    </span>
                  )}
                  {op.isQrApplicable && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 whitespace-nowrap">
                      QR
                    </span>
                  )}
                </div>
              </div>
              <dl className="space-y-1.5">
                {([
                  ["Identifier",   identifierName ?? "-"],
                  ["Target Qty",   op.targetQty],
                  ["Produced Qty", op.producedQty],
                  ["Pending Qty",  op.pendingQty],
                  ["Reject Qty",   op.rejectedQty],
                ] as [string, string | number][]).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <dt className="w-24 shrink-0 text-gray-500">{k}</dt>
                    <span className="text-gray-400">:</span>
                    <dd className="font-medium text-gray-700">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button
                onClick={() => handleSelect(op)}
                disabled={loadingId !== null}
                className="mt-4 w-full h-8 text-xs bg-amber-400 hover:bg-amber-500 text-white"
              >
                {loadingId === op.operationId ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                  </span>
                ) : "Select"}
              </Button>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
