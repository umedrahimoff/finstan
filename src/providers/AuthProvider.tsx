import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getToken, clearToken } from "@/api/client"
import { apiFetch } from "@/api/client"

interface AuthUser {
  uid: string
  username: string | null
  displayName: string | null
  role: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const p = await apiFetch<AuthUser>("/auth/me")
      setUser(p)
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    apiFetch<AuthUser>("/auth/me", { token })
      .then(setUser)
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
