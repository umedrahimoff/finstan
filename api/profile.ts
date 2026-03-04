import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../lib/jwt"
import { sql } from "../lib/db"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: "No token" })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" })
  }

  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM users WHERE id = ${payload.uid} LIMIT 1`
    const u = rows[0] as Record<string, unknown> | undefined
    if (!u) {
      return res.status(404).json({ error: "User not found" })
    }
    return res.status(200).json({
      uid: u.id,
      telegramId: u.telegram_id,
      username: u.username,
      firstName: u.first_name,
      lastName: u.last_name,
      displayName: u.display_name,
      photoURL: u.photo_url,
      phone: u.phone,
      role: u.role,
    })
  }

  if (req.method === "PATCH") {
    const { firstName, lastName, phone } = req.body as {
      firstName?: string | null
      lastName?: string | null
      phone?: string | null
    }
    const displayName = [firstName ?? null, lastName ?? null]
      .filter(Boolean)
      .join(" ")
      .trim() || null

    await sql`
      UPDATE users SET
        first_name = ${firstName ?? null},
        last_name = ${lastName ?? null},
        phone = ${phone ?? null},
        display_name = ${displayName},
        updated_at = NOW()
      WHERE id = ${payload.uid}
    `
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
