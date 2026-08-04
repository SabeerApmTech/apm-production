import type { LogReportEntry } from "@/types/productionMonitoring"

/** The id of the session currently open (or just closed) — the most recent START row's
 *  transactionLogId (or reworkTransactionLogId for a rework operation), NOT simply the last log
 *  row's id. Each log row gets its own distinct id, so a PAUSE/RESUME/STOP row logged after START
 *  carries a different id than the START row itself; the START row's id is the one that
 *  GET .../current-session actually expects to identify the session. */
export function getCurrentSessionLogId(logs: LogReportEntry[]): number | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].logEvent === "START") {
      return logs[i].transactionLogId ?? logs[i].reworkTransactionLogId ?? null
    }
  }
  return null
}
