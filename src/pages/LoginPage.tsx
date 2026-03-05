import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { setToken } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login"
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const text = await res.text()
      let json: { error?: string; token?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(res.ok ? "Ошибка ответа сервера" : "Сервер недоступен. Проверьте, что API запущен.")
      }
      if (!res.ok) {
        throw new Error(json.error || "Ошибка")
      }
      if (!json.token) {
        throw new Error("Нет токена в ответе")
      }
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Finstan</h1>
          <p className="text-muted-foreground">
            {isRegister ? "Регистрация" : "Вход"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Логин"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? (
            <>
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-primary underline"
              >
                Войти
              </button>
            </>
          ) : (
            <>
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-primary underline"
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
