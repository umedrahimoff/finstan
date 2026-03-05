import { createContext, useContext, type ReactNode } from "react"

interface AuthUser {
  uid: string
  username: string | null
  displayName: string | null
  role: string | null
}

interface AuthContextValue {
  user: AuthUser
  loading: false
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GUEST_USER: AuthUser = {
  uid: "guest",
  username: "Пользователь",
  displayName: "Пользователь",
  role: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    user: GUEST_USER,
    loading: false,
    refreshProfile: async () => {},
  }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
