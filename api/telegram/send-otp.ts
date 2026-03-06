import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  return res.ok
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const authHeader = req.headers.authorization?.replace("Bearer ", "")
  if (!authHeader) return res.status(401).json({ error: "Войдите в систему" })

  const payload = await verifyToken(authHeader)
  if (!payload) return res.status(401).json({ error: "Неверный токен" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN не настроен" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const rows = await sql`
    SELECT telegram_chat_id FROM app_users WHERE id = ${payload.uid} LIMIT 1
  `
  const chatId = (rows[0] as { telegram_chat_id: string | null } | undefined)?.telegram_chat_id
  if (!chatId) {
    return res.status(400).json({ error: "Привяжите Telegram в настройках" })
  }

  const code = randomOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  const id = crypto.randomUUID()

  await sql`
    INSERT INTO telegram_otp_codes (id, user_id, code, expires_at)
    VALUES (${id}, ${payload.uid}, ${code}, ${expiresAt.toISOString()})
  `

  const sent = await sendTelegramMessage(chatId, `Finstan OTP: ${code}\nКод действителен 5 минут.`)
  if (!sent) {
    await sql`DELETE FROM telegram_otp_codes WHERE id = ${id}`
    return res.status(500).json({ error: "Не удалось отправить в Telegram" })
  }

  return res.status(200).json({ ok: true })
}
