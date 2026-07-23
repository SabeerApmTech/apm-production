const PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-pink-100",   text: "text-pink-700" },
  { bg: "bg-rose-100",   text: "text-rose-700" },
  { bg: "bg-amber-100",  text: "text-amber-700" },
  { bg: "bg-teal-100",   text: "text-teal-700" },
  { bg: "bg-green-100",  text: "text-green-700" },
  { bg: "bg-cyan-100",   text: "text-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
]

/**
 * Deterministically maps a process team name to one of a fixed palette of badge colors — the
 * same team always renders the same color (a real `Math.random()` per render would flicker
 * between colors on every re-render), while distinct teams read as visually distinct at a glance.
 */
export function processTeamBadgeClasses(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  const { bg, text } = PALETTE[Math.abs(hash) % PALETTE.length]
  return `${bg} ${text}`
}
