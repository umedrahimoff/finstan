import { useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { useCompanyDataStore } from "@/stores/useCompanyDataStore"
import { apiFetch } from "@/api/client"

let syncTimeout: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 1500

function syncToServer(byCompany: Record<string, unknown>) {
  apiFetch("/data", {
    method: "PUT",
    body: JSON.stringify({ byCompany }),
  }).catch((err) => console.error("Data sync failed:", err))
}

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const setByCompanyFromServer = useCompanyDataStore((s) => s.setByCompanyFromServer)
  const loadedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    if (loadedForUser.current === user.uid) return
    loadedForUser.current = user.uid
    apiFetch<{ byCompany?: Record<string, unknown> }>("/data")
      .then((res) => {
        if (res?.byCompany && Object.keys(res.byCompany).length > 0) {
          setByCompanyFromServer(res.byCompany as Parameters<typeof setByCompanyFromServer>[0])
        } else {
          const current = useCompanyDataStore.getState().byCompany
          if (Object.keys(current).length > 0) {
            syncToServer(current)
          }
        }
      })
      .catch(() => {})
      .finally(() => {})
  }, [user?.uid, setByCompanyFromServer])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = useCompanyDataStore.subscribe((state) => {
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        syncTimeout = null
        syncToServer(state.byCompany)
      }, DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [user?.uid])

  return <>{children}</>
}
