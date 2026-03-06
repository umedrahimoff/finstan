import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function sendTgMessage(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
  return res.ok
}

function randomCode(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const route = (req.query.route as string) ?? ""

  if (route === "webhook") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" })
    const body = req.body as { message?: { chat?: { id: number }; text?: string } }
    const msg = body?.message
    if (!msg?.chat?.id || !msg?.text) return res.status(200).json({ ok: true })
    const chatId = msg.chat.id
    const text = msg.text.trim()
    const url = process.env.DATABASE_URL
    if (!url) {
      await sendTgMessage(chatId, "Ошибка: база данных не настроена.")
      return res.status(200).json({ ok: true })
    }
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    if (text.startsWith("/start")) {
      const payload = text.replace(/^\/start\s*/, "").trim()
      if (!payload) {
        const existing = await sql`SELECT id FROM app_users WHERE telegram_chat_id = ${String(chatId)} LIMIT 1`
        if (existing.length > 0) {
          await sendTgMessage(chatId, "Вы уже зарегистрированы. Войдите на finstan.vercel.app")
          return res.status(200).json({ ok: true })
        }
        const regCode = randomCode(8)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await sql`INSERT INTO telegram_reg_codes (code, chat_id, expires_at) VALUES (${regCode}, ${String(chatId)}, ${expiresAt.toISOString()})`
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://finstan.vercel.app"
        await sendTgMessage(chatId, `Код для регистрации: ${regCode}\n\nПерейдите на ${baseUrl}/register — введите код, логин и название компании. После регистрации вход только по коду из Telegram. Код действителен 15 мин.`)
        return res.status(200).json({ ok: true })
      }
      const code = payload
      const rows = await sql`SELECT user_id FROM telegram_link_codes WHERE code = ${code} AND expires_at > now() LIMIT 1`
      const row = rows[0] as { user_id: string } | undefined
      if (!row) {
        await sendTgMessage(chatId, "Код истёк или неверный. Сгенерируйте новый в настройках Finstan.")
        return res.status(200).json({ ok: true })
      }
      await sql`UPDATE app_users SET telegram_chat_id = ${String(chatId)} WHERE id = ${row.user_id}`
      await sql`DELETE FROM telegram_link_codes WHERE code = ${code}`
      await sendTgMessage(chatId, "✅ Аккаунт Finstan привязан!")
    }
    return res.status(200).json({ ok: true })
  }

  if (route === "request-login-otp") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
    const url = process.env.DATABASE_URL
    if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
    if (!process.env.TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN не настроен" })
    const { username } = (req.body ?? {}) as { username?: string }
    const u = (username ?? "").trim()
    if (!u) return res.status(400).json({ error: "Введите логин" })
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    const rows = await sql`SELECT id, telegram_chat_id FROM app_users WHERE username = ${u} AND frozen = false LIMIT 1`
    const user = rows[0] as { id: string; telegram_chat_id: string | null } | undefined
    if (!user || !user.telegram_chat_id) return res.status(400).json({ error: "Пользователь не найден или Telegram не привязан" })
    const code = randomOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const id = crypto.randomUUID()
    await sql`INSERT INTO telegram_otp_codes (id, user_id, code, expires_at) VALUES (${id}, ${user.id}, ${code}, ${expiresAt.toISOString()})`
    const sent = await sendTgMessage(user.telegram_chat_id, `Finstan: код для входа ${code}\nДействителен 5 минут.`)
    if (!sent) {
      await sql`DELETE FROM telegram_otp_codes WHERE id = ${id}`
      return res.status(500).json({ error: "Не удалось отправить в Telegram" })
    }
    return res.status(200).json({ ok: true })
  }

  const authHeader = req.headers.authorization?.replace("Bearer ", "")
  if (!authHeader) return res.status(401).json({ error: "Войдите в систему" })
  const payload = await verifyToken(authHeader)
  if (!payload) return res.status(401).json({ error: "Неверный токен" })
  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  if (route === "link") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })
    const code = randomCode(8)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await sql`INSERT INTO telegram_link_codes (code, user_id, expires_at) VALUES (${code}, ${payload.uid}, ${expiresAt.toISOString()})`
    return res.status(200).json({ link: `https://t.me/finstanbasebot?start=${code}`, code, expiresAt: expiresAt.toISOString(), expiresIn: 600 })
  }

  if (route === "status") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })
    const rows = await sql`SELECT telegram_chat_id FROM app_users WHERE id = ${payload.uid} LIMIT 1`
    const chatId = (rows[0] as { telegram_chat_id: string | null } | undefined)?.telegram_chat_id
    return res.status(200).json({ linked: !!chatId })
  }

  if (route === "send-otp") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
    if (!process.env.TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN не настроен" })
    const rows = await sql`SELECT telegram_chat_id FROM app_users WHERE id = ${payload.uid} LIMIT 1`
    const chatId = (rows[0] as { telegram_chat_id: string | null } | undefined)?.telegram_chat_id
    if (!chatId) return res.status(400).json({ error: "Привяжите Telegram в настройках" })
    const code = randomOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const id = crypto.randomUUID()
    await sql`INSERT INTO telegram_otp_codes (id, user_id, code, expires_at) VALUES (${id}, ${payload.uid}, ${code}, ${expiresAt.toISOString()})`
    const sent = await sendTgMessage(chatId, `Finstan OTP: ${code}\nКод действителен 5 минут.`)
    if (!sent) {
      await sql`DELETE FROM telegram_otp_codes WHERE id = ${id}`
      return res.status(500).json({ error: "Не удалось отправить в Telegram" })
    }
    return res.status(200).json({ ok: true })
  }

  if (route === "verify-otp") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
    const { code } = (req.body ?? {}) as { code?: string }
    const c = (code ?? "").trim()
    if (!c || c.length !== 6) return res.status(400).json({ error: "Введите 6-значный код" })
    const rows = await sql`SELECT id FROM telegram_otp_codes WHERE user_id = ${payload.uid} AND code = ${c} AND expires_at > now() LIMIT 1`
    const row = rows[0] as { id: string } | undefined
    if (!row) return res.status(400).json({ error: "Код неверный или истёк" })
    await sql`DELETE FROM telegram_otp_codes WHERE id = ${row.id}`
    return res.status(200).json({ ok: true })
  }

  return res.status(404).json({ error: "Not found" })
}
