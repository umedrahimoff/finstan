import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../lib/jwt"
import { sql } from "../lib/db"

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
  const adminUid = await requireAdmin(req)
  if (!adminUid) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM invites ORDER BY created_at DESC`
    const invites = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      username: r.username,
      role: r.role,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }))
    return res.status(200).json(invites)
  }

  if (req.method === "POST") {
    const { username, role } = req.body as { username?: string; role?: string | null }
    const normalized = username?.trim().toLowerCase().replace(/^@/, "")
    if (!normalized) {
      return res.status(400).json({ error: "Введите username" })
    }

    const existing = await sql`SELECT id FROM invites WHERE username = ${normalized} LIMIT 1`
    if (existing.length > 0) {
      return res.status(400).json({ error: "Приглашение для этого username уже существует" })
    }

    const usersWithUsername = await sql`SELECT id FROM users WHERE username = ${normalized} LIMIT 1`
    if (usersWithUsername.length > 0) {
      return res.status(400).json({ error: "Пользователь с этим username уже зарегистрирован" })
    }

    const id = crypto.randomUUID()
    await sql`
      INSERT INTO invites (id, username, role, created_by)
      VALUES (${id}, ${normalized}, ${role ?? null}, ${adminUid})
    `
    return res.status(200).json({ id })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
