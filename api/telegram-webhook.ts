import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sql } from "../lib/db"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://finstan.vercel.app")

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: { id: number; type: string }
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN
  const hasDb = !!process.env.DATABASE_URL
  console.log("[webhook] received, token:", hasToken, "db:", hasDb)

  try {
    const rawBody = req.body
    const body = (typeof rawBody === "string" ? JSON.parse(rawBody || "{}") : rawBody || {}) as TelegramUpdate
    const message = body.message
    if (!message?.from || !message?.text) {
      return res.status(200).json({ ok: true })
    }

    const text = message.text
    const from = message.from

    if (text === "/start") {
      await sendTelegramMessage(
        message.chat.id,
        "Для входа в Finstan перейдите на сайт и нажмите «Войти через Telegram»."
      )
    } else if (text.startsWith("/start login_")) {
      const state = text.slice("/start login_".length).trim()
      if (!state || state.length > 64) {
        await sendTelegramMessage(message.chat.id, "Ошибка: неверная ссылка")
        return res.status(200).json({ ok: true })
      }

      const username = from.username
        ? String(from.username).trim().toLowerCase().replace(/^@/, "")
        : null

      await sql`
        INSERT INTO auth_pending (state, telegram_id, username, first_name, last_name)
        VALUES (${state}, ${String(from.id)}, ${username}, ${from.first_name ?? null}, ${from.last_name ?? null})
        ON CONFLICT (state) DO UPDATE SET
          telegram_id = EXCLUDED.telegram_id,
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          created_at = NOW()
      `

      const authUrl = `${SITE_URL}/auth?state=${state}`
      const sent = await sendTelegramMessage(
        message.chat.id,
        `Подтвердите вход в Finstan:\n\n${authUrl}`,
        authUrl
      )
      if (!sent) {
        await sendTelegramMessage(message.chat.id, "Ошибка отправки. Попробуйте позже.")
      }
    }
  } catch (err) {
    console.error("Telegram webhook error:", err)
    if (err instanceof SyntaxError) {
      console.error("[webhook] body:", typeof req.body, String(req.body)?.slice(0, 200))
    }
  }

  return res.status(200).json({ ok: true })
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: string
): Promise<boolean> {
  if (!BOT_TOKEN) return false
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  }
  if (replyMarkup) {
    body.reply_markup = {
      inline_keyboard: [[{ text: "Войти в Finstan", url: replyMarkup }]],
    }
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as { ok?: boolean }
    return data.ok === true
  } catch {
    return false
  }
}
