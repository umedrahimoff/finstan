import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

function randomCode(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })

  const authHeader = req.headers.authorization?.replace("Bearer ", "")
  if (!authHeader) return res.status(401).json({ error: "Войдите в систему" })

  const payload = await verifyToken(authHeader)
  if (!payload) return res.status(401).json({ error: "Неверный токен" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const code = randomCode(8)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await sql`
    INSERT INTO telegram_link_codes (code, user_id, expires_at)
    VALUES (${code}, ${payload.uid}, ${expiresAt.toISOString()})
  `

  const link = `https://t.me/finstanbasebot?start=${code}`

  return res.status(200).json({
    link,
    code,
    expiresAt: expiresAt.toISOString(),
    expiresIn: 600,
  })
}
