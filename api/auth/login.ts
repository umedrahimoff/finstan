import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })

  const body = (req.body ?? {}) as { username?: string; password?: string; code?: string }
  const u = (body.username ?? "").trim()
  if (!u) return res.status(400).json({ error: "Введите логин" })

  const { neon } = await import("@neondatabase/serverless")
  const { createToken } = await import("../../lib/jwt.js")
  const sql = neon(url)

  const userRows = await sql`SELECT id, username, role, tenant_id, telegram_chat_id, password_hash FROM app_users WHERE username = ${u} AND frozen = false LIMIT 1`
  const user = userRows[0] as { id: string; username: string; role: string; tenant_id: string | null; telegram_chat_id: string | null; password_hash: string } | undefined
  if (!user) return res.status(401).json({ error: "Пользователь не найден" })

  const c = (body.code ?? "").trim()
  if (user.telegram_chat_id && c.length === 6) {
    const otpRows = await sql`SELECT id FROM telegram_otp_codes WHERE user_id = ${user.id} AND code = ${c} AND expires_at > now() LIMIT 1`
    const otp = otpRows[0] as { id: string } | undefined
    if (!otp) return res.status(401).json({ error: "Код неверный или истёк" })
    await sql`DELETE FROM telegram_otp_codes WHERE id = ${otp.id}`
    const token = await createToken({ uid: user.id, username: user.username, role: user.role ?? "moderator", tenantId: user.tenant_id ?? null })
    return res.status(200).json({ token })
  }

  if (!user.telegram_chat_id) {
    const p = body.password ?? ""
    if (!p) return res.status(400).json({ error: "Привяжите Telegram в настройках или введите пароль" })
    const bcrypt = (await import("bcryptjs")).default
    if (!(await bcrypt.compare(p, user.password_hash))) return res.status(401).json({ error: "Неверный пароль" })
    const token = await createToken({ uid: user.id, username: user.username, role: user.role ?? "moderator", tenantId: user.tenant_id ?? null })
    return res.status(200).json({ token })
  }

  return res.status(400).json({ error: "Отправьте код из Telegram" })
}
