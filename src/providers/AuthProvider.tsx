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
        const token = await u.getIdTokenResult()
        const claims = token.claims as Record<string, unknown>
        const telegramId = String(claims.telegram_id ?? "").replace(/^tg_/, "")
        const username = (claims.username as string) ?? null
        const firstName = (claims.first_name as string) ?? null
        const lastName = (claims.last_name as string) ?? null
        const photoURL = (claims.photo_url as string) ?? null

        const r = await ensureUserDoc(
          u.uid,
          telegramId,
          username,
          firstName,
          lastName,
          photoURL
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
