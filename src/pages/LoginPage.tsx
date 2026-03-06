import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { setToken } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE = import.meta.env.VITE_API_URL ?? "/api"

export function LoginPage() {
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: { pathname: string } })?.from?.pathname ?? "/app"
  const [mode, setMode] = useState<"otp" | "password">("otp")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${window.location.origin}${API_BASE}/telegram/request-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })
      const text = await res.text()
      let json: { error?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {}
      if (!res.ok) throw new Error(json.error || "Ошибка")
      setOtpSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${window.location.origin}${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), code: otpCode }),
      })
      const text = await res.text()
      let json: { error?: string; token?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {}
      if (!res.ok) throw new Error(json.error || "Ошибка")
      if (!json.token) throw new Error("Нет токена")
      setToken(json.token)
      navigate(from, { replace: true })
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${window.location.origin}${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const text = await res.text()
      let json: { error?: string; token?: string } = {}
      try { json = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) throw new Error(json.error || "Ошибка")
      if (!json.token) throw new Error("Нет токена")
      setToken(json.token)
      navigate(from, { replace: true })
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← На главную
      </Link>
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Вход</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "otp" ? "Код придёт в Telegram" : "Для пользователей без Telegram"}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant={mode === "otp" ? "default" : "outline"} size="sm" onClick={() => { setMode("otp"); setError(""); setOtpSent(false) }}>Код</Button>
          <Button type="button" variant={mode === "password" ? "default" : "outline"} size="sm" onClick={() => { setMode("password"); setError("") }}>Пароль</Button>
        </div>
        {mode === "otp" ? (
        <form onSubmit={otpSent ? handleSubmitOtp : handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              disabled={otpSent}
            />
          </div>
          {otpSent && (
            <div className="space-y-2">
              <Label htmlFor="otp">Код из Telegram</Label>
              <Input
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : otpSent ? "Войти" : "Отправить код в Telegram"}
          </Button>
        </form>
        ) : (
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username-pw">Логин</Label>
            <Input id="username-pw" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "Войти"}</Button>
        </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Регистрация
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Условия использования</Link>
          {" · "}
          <Link to="/privacy" className="hover:text-foreground">Политика конфиденциальности</Link>
        </p>
      </div>
    </div>
  )
}
