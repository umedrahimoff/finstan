import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

const INVITE_ERROR = "Нет доступа. Для входа нужно приглашение от администратора. Обратитесь к владельцу приложения."

function generateState(): string {
  return crypto.randomUUID()
}

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("error") === "invite_required") {
      setError(INVITE_ERROR)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME
  const handleLogin = () => {
    if (!botName) {
      setError("Не настроен VITE_TELEGRAM_BOT_NAME")
      return
    }
    setError("")
    setLoading(true)
    const state = generateState()
    window.location.href = `https://t.me/${botName}?start=login_${state}`
  }

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

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || !botName}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0088cc] px-4 py-3 text-white transition hover:bg-[#0077b5] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Войти через Telegram
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Откроется Telegram. Подтвердите вход в боте и перейдите по ссылке.
        </p>
      </div>
    </div>
  )
}
