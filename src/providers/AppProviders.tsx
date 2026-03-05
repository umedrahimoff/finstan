import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "./AuthProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </AuthProvider>
  )
}
