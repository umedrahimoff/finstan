import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

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

  const rows = await sql`
    SELECT telegram_chat_id FROM app_users WHERE id = ${payload.uid} LIMIT 1
  `
  const chatId = (rows[0] as { telegram_chat_id: string | null } | undefined)?.telegram_chat_id

  return res.status(200).json({ linked: !!chatId })
}
