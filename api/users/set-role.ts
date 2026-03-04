import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt"
import { sql } from "../../lib/db"

const GLOBAL_ADMIN_TG_ID = process.env.TELEGRAM_GLOBAL_ADMIN_ID || ""

async function requireAdmin(req: VercelRequest): Promise<string | null> {
  const auth = req.headers.authorization
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const rows = await sql`SELECT role, telegram_id FROM users WHERE id = ${payload.uid} LIMIT 1`
  const u = rows[0] as Record<string, unknown> | undefined
  if (!u) return null
  const isAdmin =
    u.role === "admin" || (u.telegram_id as string) === GLOBAL_ADMIN_TG_ID
  return isAdmin ? payload.uid : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const adminUid = await requireAdmin(req)
  if (!adminUid) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { targetUid, role } = req.body as { targetUid?: string; role?: string | null }
  if (!targetUid) {
    return res.status(400).json({ error: "targetUid required" })
  }

  const target = await sql`SELECT * FROM users WHERE id = ${targetUid} LIMIT 1`
  const t = target[0] as Record<string, unknown> | undefined
  if (!t) {
    return res.status(404).json({ error: "Пользователь не найден" })
  }
  if (t.role === "admin" || (t.telegram_id as string) === GLOBAL_ADMIN_TG_ID) {
    return res.status(400).json({ error: "Нельзя изменить роль администратора" })
  }

  await sql`UPDATE users SET role = ${role ?? null}, updated_at = NOW() WHERE id = ${targetUid}`
  return res.status(200).json({ ok: true })
}
