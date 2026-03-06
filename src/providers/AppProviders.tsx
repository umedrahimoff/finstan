import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "./AuthProvider"
import { DataSyncProvider } from "./DataSyncProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataSyncProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </DataSyncProvider>
    </AuthProvider>
  )
}
