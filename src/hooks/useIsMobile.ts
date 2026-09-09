import { useEffect, useState } from "react"

// Below this width the drill-down side panels (Products → States → Operations, etc.) can't sit
// next to the table any more — callers switch to a stacked Drawer instead.
const MOBILE_QUERY = "(max-width: 767px)"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}
