import type { VercelRequest, VercelResponse } from "@vercel/node"

const BOT_USERNAME = "finstanbasebot"

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" })

  const body = req.body as {
    message?: {
      chat?: { id: number; type?: string }
      from?: { id: number; username?: string }
      text?: string
    }
  }
  const msg = body?.message
  if (!msg?.chat?.id || !msg?.text) return res.status(200).json({ ok: true })

  const chatId = msg.chat.id
  const text = msg.text.trim()
  const url = process.env.DATABASE_URL
  if (!url) {
    await sendTelegramMessage(chatId, "Ошибка: база данных не настроена.")
    return res.status(200).json({ ok: true })
  }

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  if (text.startsWith("/start")) {
    const code = text.replace(/^\/start\s*/, "").trim()
    if (!code) {
      await sendTelegramMessage(
        chatId,
        `Привет! Я бот Finstan для OTP-кодов.\n\nЧтобы привязать аккаунт:\n1. Откройте Finstan → Настройки → Telegram\n2. Нажмите «Привязать»\n3. Перейдите по ссылке`
      )
      return res.status(200).json({ ok: true })
    }

    const rows = await sql`
      SELECT user_id FROM telegram_link_codes
      WHERE code = ${code} AND expires_at > now()
      LIMIT 1
    `
    const row = rows[0] as { user_id: string } | undefined
    if (!row) {
      await sendTelegramMessage(chatId, "Код истёк или неверный. Сгенерируйте новый в настройках Finstan.")
      return res.status(200).json({ ok: true })
    }

    await sql`UPDATE app_users SET telegram_chat_id = ${String(chatId)} WHERE id = ${row.user_id}`
    await sql`DELETE FROM telegram_link_codes WHERE code = ${code}`

    await sendTelegramMessage(chatId, "✅ Аккаунт Finstan привязан! Теперь OTP-коды будут приходить сюда.")
  }

  return res.status(200).json({ ok: true })
}
