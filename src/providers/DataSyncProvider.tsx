import { useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { apiFetch } from "@/api/client"

let syncTimeout: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 1500

function syncToServer(byCompany: Record<string, unknown>, companies: { id: string; name: string; archived?: boolean }[]) {
  apiFetch("/data", {
    method: "PUT",
    body: JSON.stringify({ byCompany, companies }),
  }).catch((err) => console.error("Data sync failed:", err))
}

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const loadedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    if (loadedForUser.current === user.uid) return
    loadedForUser.current = user.uid
    apiFetch<{ byCompany?: Record<string, unknown>; companies?: { id: string; name: string; archived?: boolean }[] }>("/data")
      .then((res) => {
        if (res?.companies && res.companies.length > 0) {
          useCompanyStore.getState().setCompaniesFromServer(res.companies)
        }
        if (res?.byCompany && Object.keys(res.byCompany).length > 0) {
          useCompanyDataStore.getState().setByCompanyFromServer(res.byCompany as never)
          const demoData = res.byCompany.demo as { transactions?: unknown[] } | undefined
          if (demoData && (demoData.transactions?.length ?? 0) > 0) {
            const store = useCompanyStore.getState()
            store.ensureCompany("demo", "Демо")
            store.setCurrentCompany("demo")
          }
        } else {
          const current = useCompanyDataStore.getState().byCompany
          const companies = useCompanyStore.getState().companies
          if (Object.keys(current).length > 0) {
            syncToServer(current, companies)
          }
        }
      })
      .catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    let mounted = true
    const unsubData = useCompanyDataStore.subscribe((state) => {
      if (!mounted) return
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        syncTimeout = null
        if (mounted) {
          const companies = useCompanyStore.getState().companies
          syncToServer(state.byCompany, companies)
        }
      }, DEBOUNCE_MS)
    })
    const unsubCompanies = useCompanyStore.subscribe((state) => {
      if (!mounted) return
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        syncTimeout = null
        if (mounted) {
          const byCompany = useCompanyDataStore.getState().byCompany
          syncToServer(byCompany, state.companies)
        }
      }, DEBOUNCE_MS)
    })
    return () => {
      mounted = false
      unsubData()
      unsubCompanies()
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [user?.uid])

  return <>{children}</>
}
