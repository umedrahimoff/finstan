import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initTheme } from "@/lib/theme"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import "./index.css"
import App from "./App.tsx"

initTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
