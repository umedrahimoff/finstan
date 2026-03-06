import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const authHeader = req.headers.authorization?.replace("Bearer ", "")
  if (!authHeader) return res.status(401).json({ error: "Войдите в систему" })

  const payload = await verifyToken(authHeader)
  if (!payload) return res.status(401).json({ error: "Неверный токен" })

  const { code } = (req.body ?? {}) as { code?: string }
  const c = (code ?? "").trim()
  if (!c || c.length !== 6) return res.status(400).json({ error: "Введите 6-значный код" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const rows = await sql`
    SELECT id FROM telegram_otp_codes
    WHERE user_id = ${payload.uid} AND code = ${c} AND expires_at > now()
    LIMIT 1
  `
  const row = rows[0] as { id: string } | undefined
  if (!row) {
    return res.status(400).json({ error: "Код неверный или истёк" })
  }

  await sql`DELETE FROM telegram_otp_codes WHERE id = ${row.id}`

  return res.status(200).json({ ok: true })
}
