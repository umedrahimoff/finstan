export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "finstan-theme"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system"
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const effective = theme === "system" ? getSystemTheme() : theme
  root.classList.toggle("dark", effective === "dark")
}

export function initTheme() {
  applyTheme(getStoredTheme())
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (getStoredTheme() === "system") applyTheme("system")
      })
  }
}
