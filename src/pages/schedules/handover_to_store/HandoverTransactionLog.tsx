import { FileClock } from "lucide-react"

// The transaction log's own API hasn't been provided yet — this tab is kept in place (matching
// the pending-list tab it sits next to) so the page's shape is right, with its data wired up
// once that endpoint is integrated.
export function HandoverTransactionLog() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 text-center">
      <FileClock className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Handover Transaction Log</p>
        <p className="mt-1 text-sm text-muted-foreground">This log will be available once its API is integrated.</p>
      </div>
    </div>
  )
}
