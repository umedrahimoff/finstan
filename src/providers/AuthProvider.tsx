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
import type { UserProfile, UserRole } from "@/lib/userRoles"

interface AuthUser {
  uid: string
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  photoURL: string | null
  phone: string | null
  role: UserRole | null
}

interface AuthContextValue {
  user: AuthUser | null
  role: UserRole | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const p = await apiFetch<AuthUser>("/auth/me")
      setProfile(p)
      setUser(p)
      setRole(p.role)
    } catch {
      setProfile(null)
      setUser(null)
      setRole(null)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setRole(null)
      setProfile(null)
      setLoading(false)
      return
    }

    apiFetch<AuthUser>("/auth/me", { token })
      .then((p) => {
        setUser(p)
        setRole(p.role)
        setProfile(p)
      })
      .catch(() => {
        clearToken()
        setUser(null)
        setRole(null)
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
