import { useCallback, useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const THEME_KEY = "theme"

function readStoredTheme(): Theme {
  // Deliberately never reads prefers-color-scheme — light is the default until the user opts in.
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

// Module-level store (not per-component useState) so every component calling useTheme() — Header,
// DataTable, etc. — re-renders in sync when one of them toggles the theme, instead of only picking
// up the change on the next full page load.
let currentTheme: Theme = readStoredTheme()
applyTheme(currentTheme)

const listeners = new Set<() => void>()

function commitTheme(next: Theme) {
  currentTheme = next
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentTheme
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  const setTheme = useCallback((next: Theme) => {
    commitTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    commitTheme(currentTheme === "dark" ? "light" : "dark")
  }, [])

  return { theme, setTheme, toggleTheme }
}
