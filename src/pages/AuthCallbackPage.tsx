import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { setToken } from "@/api/client"

const INVITE_ERROR = "Нет доступа. Для входа нужно приглашение от администратора."

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState("")

  useEffect(() => {
    const state = searchParams.get("state")
    if (!state) {
      setError("Неверная ссылка")
      return
    }

    const base = typeof window !== "undefined" ? window.location.origin : ""
    fetch(`${base}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.token) {
          const msg = json.error === "INVITE_REQUIRED" ? INVITE_ERROR : (json.error || "Ошибка авторизации")
          throw new Error(msg)
        }
        setToken(json.token)
        navigate("/", { replace: true })
        window.location.reload()
      })
      .catch((err) => setError((err as Error).message))
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-destructive">{error}</p>
        <a href="/login" className="text-primary underline">
          Вернуться на страницу входа
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
