import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { signInWithCustomToken } from "firebase/auth"
import { auth } from "@/lib/firebase"

const INVITE_ERROR = "Нет доступа. Для входа нужно приглашение от администратора. Обратитесь к владельцу приложения."

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramAuthUser) => void
    }
  }
}

interface TelegramAuthUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("error") === "invite_required") {
      setError(INVITE_ERROR)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleTelegramAuth = useCallback(
    async (tgUser: TelegramAuthUser) => {
      setError("")
      setLoading(true)
      try {
        const data: Record<string, string> = {
          id: String(tgUser.id),
          first_name: tgUser.first_name,
          auth_date: String(tgUser.auth_date),
          hash: tgUser.hash,
        }
        if (tgUser.last_name) data.last_name = tgUser.last_name
        if (tgUser.username) data.username = tgUser.username
        if (tgUser.photo_url) data.photo_url = tgUser.photo_url

        const base = typeof window !== "undefined" ? window.location.origin : ""
        const res = await fetch(`${base}/api/telegram-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || "Ошибка авторизации")
        }
        await signInWithCustomToken(auth, json.token)
        navigate(from, { replace: true })
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [navigate, from]
  )

  useEffect(() => {
    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME
    if (!botName) {
      setError("Не настроен VITE_TELEGRAM_BOT_NAME")
      return
    }

    ;(window as Window & { __tgAuthCallback?: (u: TelegramAuthUser) => void }).__tgAuthCallback =
      (u: TelegramAuthUser) => handleTelegramAuth(u)

    const container = document.getElementById("telegram-login")
    if (!container) return

    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.async = true
    script.setAttribute("data-telegram-login", botName)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-onauth", "window.__tgAuthCallback(user)")
    script.setAttribute("data-request-access", "write")
    container.appendChild(script)

    return () => {
      script.remove()
      container.innerHTML = ""
    }
  }, [handleTelegramAuth])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Finstan</h1>
          <p className="text-muted-foreground">Войдите через Telegram</p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div
            id="telegram-login"
            className="flex justify-center [&_iframe]:!h-12 [&_iframe]:!min-h-12"
          />
        )}
      </div>
    </div>
  )
}
