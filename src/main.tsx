import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initTheme } from "@/lib/theme"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import "./index.css"

initTheme()

const root = document.getElementById("root")!

function showConfigError(msg: string) {
  root.innerHTML = `
    <div style="display:flex;min-height:100vh;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1rem;font-family:system-ui,sans-serif">
      <h1 style="font-size:1.25rem;font-weight:bold">Ошибка конфигурации</h1>
      <p style="max-width:28rem;text-align:center;color:#666">${msg}</p>
    </div>
  `
}

import("./App.tsx")
  .then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  })
  .catch((e) => {
    console.error("App load failed:", e)
    showConfigError(e?.message ?? "Не удалось загрузить приложение.")
  })
