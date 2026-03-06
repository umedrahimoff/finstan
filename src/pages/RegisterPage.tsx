import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { setToken } from "@/api/client"
import { useAuth } from "@/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE = import.meta.env.VITE_API_URL ?? "/api"

export function RegisterPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (user) return <Navigate to="/app" replace />
  const [code, setCode] = useState("")
  const [username, setUsername] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch(`${window.location.origin}${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          username: username.trim(),
          companyName: companyName.trim(),
        }),
      })
      const text = await res.text()
      let json: { error?: string; token?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(res.ok ? "Ошибка ответа сервера" : "Ошибка сервера")
      }
      if (!res.ok) throw new Error(json.error || "Ошибка")
      if (!json.token) throw new Error("Нет токена")
      setToken(json.token)
      navigate("/app", { replace: true })
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← На главную
      </Link>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Регистрация</h1>
        <p className="text-sm text-muted-foreground">
          Отправьте /start боту @finstanbasebot в Telegram, получите код и введите его ниже.
        </p>
        <div className="space-y-2">
          <Label htmlFor="code">Код из Telegram</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
            placeholder="ABC12345"
            maxLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Логин</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            minLength={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Название компании</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Моя компания"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "..." : "Зарегистрироваться"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  )
}
