import { useState, useEffect } from "react"
import { Send, Link2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/api/client"

const BOT_LINK = "https://t.me/finstanbasebot"

export function SettingsTelegramPage() {
  const [linked, setLinked] = useState<boolean | null>(null)
  const [linkData, setLinkData] = useState<{ link: string; code: string; expiresIn: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")

  const loadStatus = () => {
    apiFetch<{ linked: boolean }>("/telegram/status")
      .then((r) => setLinked(r.linked))
      .catch(() => setLinked(false))
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleGetLink = async () => {
    setError("")
    setLoading(true)
    setLinkData(null)
    try {
      const r = await apiFetch<{ link: string; code: string; expiresIn: number }>("/telegram/link")
      setLinkData({ link: r.link, code: r.code, expiresIn: r.expiresIn })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    setOtpError("")
    setOtpLoading(true)
    setOtpSent(false)
    try {
      await apiFetch("/telegram/send-otp", { method: "POST" })
      setOtpSent(true)
    } catch (err) {
      setOtpError((err as Error).message)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError("")
    setOtpLoading(true)
    try {
      await apiFetch("/telegram/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code: otpCode }),
      })
      setOtpCode("")
      setOtpSent(false)
    } catch (err) {
      setOtpError((err as Error).message)
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Telegram OTP</h2>
        <p className="text-sm text-muted-foreground">
          Привяжите бота @finstanbasebot для получения OTP-кодов вместо SMS
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Привязка аккаунта
          </CardTitle>
          <CardDescription>
            Сначала запустите бота в Telegram, затем привяжите аккаунт по ссылке
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linked === true ? (
            <p className="text-sm text-green-600 dark:text-green-500">✓ Telegram привязан</p>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleGetLink}
                disabled={loading}
                className="gap-2"
              >
                <Link2 className="size-4" />
                {loading ? "..." : "Получить ссылку для привязки"}
              </Button>
              {linkData && (
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Перейдите по ссылке (код действителен 10 мин):
                  </p>
                  <a
                    href={linkData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm font-medium text-primary hover:underline"
                  >
                    {linkData.link}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Или отправьте боту: /start {linkData.code}
                  </p>
                </div>
              )}
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {linked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5" />
              Проверка OTP
            </CardTitle>
            <CardDescription>
              Отправьте код в Telegram и введите его ниже для проверки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleSendOtp}
              disabled={otpLoading}
              className="gap-2"
            >
              {otpLoading ? "..." : "Отправить OTP в Telegram"}
            </Button>
            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="otp-code">Код из Telegram</Label>
                  <Input
                    id="otp-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={otpLoading || otpCode.length !== 6}>
                    Проверить
                  </Button>
                </div>
              </form>
            )}
            {otpError && <p className="text-sm text-destructive">{otpError}</p>}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Бот:{" "}
        <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          @finstanbasebot
        </a>
      </p>
    </div>
  )
}
