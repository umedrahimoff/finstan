import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { setToken } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: { pathname: string } })?.from?.pathname ?? "/app"
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${window.location.origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const text = await res.text()
      let json: { error?: string; token?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(res.ok ? "Ошибка ответа сервера" : "Ошибка сервера. Проверьте DATABASE_URL и JWT_SECRET в Vercel.")
      }
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Вход</h1>
        <div className="space-y-2">
          <Label htmlFor="username">Логин</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : "Войти"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Условия использования</Link>
          {" · "}
          <Link to="/privacy" className="hover:text-foreground">Политика конфиденциальности</Link>
        </p>
      </form>
    </div>
  )
}
