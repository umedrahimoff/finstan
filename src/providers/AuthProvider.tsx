import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  ensureUserDoc,
  getUserProfile,
  type UserProfile,
  type UserRole,
} from "@/lib/userRoles"

interface AuthContextValue {
  user: User | null
  role: UserRole | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) return
    try {
      const p = await getUserProfile(user.uid)
      setProfile(p)
    } catch (err) {
      console.error("getUserProfile failed:", err)
      setProfile(null)
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setRole(null)
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const r = await ensureUserDoc(
          u.uid,
          u.email ?? null,
          u.displayName ?? null,
          u.photoURL ?? null
        )
        setUser(u)
        setRole(r)
        const p = await getUserProfile(u.uid)
        setProfile(p)
      } catch (err) {
        if ((err as Error)?.message === "INVITE_REQUIRED") {
          await signOut(auth)
          setUser(null)
          setRole(null)
          setProfile(null)
          window.location.href = "/login?error=invite_required"
        } else {
          console.error("Auth init failed:", err)
          setUser(null)
          setRole(null)
          setProfile(null)
        }
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
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
