import { RouterProvider } from "react-router-dom"
import { AppProviders } from "@/providers/AppProviders"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { router } from "@/routes"

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  )
}
