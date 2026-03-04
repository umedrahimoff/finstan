import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt"
import { sql } from "../../lib/db"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: "No token" })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" })
  }

  const rows = await sql`SELECT * FROM users WHERE id = ${payload.uid} LIMIT 1`
  const user = rows[0] as Record<string, unknown> | undefined
  if (!user) {
    return res.status(401).json({ error: "User not found" })
  }

  return res.status(200).json({
    uid: user.id,
    telegramId: user.telegram_id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    photoURL: user.photo_url,
    phone: user.phone,
    role: user.role,
  })
}
