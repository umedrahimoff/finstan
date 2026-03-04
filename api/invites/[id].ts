import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt"
import { sql } from "../../lib/db"

const GLOBAL_ADMIN_TG_ID = process.env.TELEGRAM_GLOBAL_ADMIN_ID || ""

async function requireAdmin(req: VercelRequest): Promise<boolean> {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return false
  const payload = await verifyToken(token)
  if (!payload) return false
  const rows = await sql`SELECT role, telegram_id FROM users WHERE id = ${payload.uid} LIMIT 1`
  const u = rows[0] as Record<string, unknown> | undefined
  if (!u) return false
  return u.role === "admin" || (u.telegram_id as string) === GLOBAL_ADMIN_TG_ID
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const ok = await requireAdmin(req)
  if (!ok) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const id = (req.query as { id?: string }).id
  if (!id) {
    return res.status(400).json({ error: "id required" })
  }

  await sql`DELETE FROM invites WHERE id = ${id}`
  return res.status(200).json({ ok: true })
}
