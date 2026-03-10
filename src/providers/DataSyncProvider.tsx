import { useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"
import { useCompanyStore } from "@/stores/useCompanyStore"
import { apiFetch } from "@/api/client"

function syncToServer(
  byCompany: Record<string, unknown>,
  companies: { id: string; name: string; archived?: boolean }[],
  opts?: { keepalive?: boolean }
) {
  apiFetch("/data", {
    method: "PUT",
    body: JSON.stringify({ byCompany, companies }),
    ...opts,
  }).catch((err) => console.error("Data sync failed:", err))
}

function flushSync() {
  const byCompany = useCompanyDataStore.getState().byCompany
  const companies = useCompanyStore.getState().companies
  if (Object.keys(byCompany).length > 0) {
    syncToServer(byCompany, companies, { keepalive: true })
  }
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
      const companies = useCompanyStore.getState().companies
      syncToServer(state.byCompany, companies)
    })
    const unsubCompanies = useCompanyStore.subscribe((state) => {
      if (!mounted) return
      const byCompany = useCompanyDataStore.getState().byCompany
      syncToServer(byCompany, state.companies)
    })
    return () => {
      mounted = false
      unsubData()
      unsubCompanies()
    }
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const onBeforeUnload = () => flushSync()
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushSync()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [user?.uid])

  return <>{children}</>
}
