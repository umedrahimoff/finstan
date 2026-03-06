import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../../lib/jwt.js"

async function getGlobalAdmin(req: VercelRequest, sql: { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> }) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  if (payload.tenantId != null) return null
  const rows = await sql`SELECT id FROM app_users WHERE id = ${payload.uid} AND frozen = false AND tenant_id IS NULL LIMIT 1`
  return rows.length > 0 ? { uid: payload.uid } : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  const id = (req.query as { id?: string }).id
  if (!id) return res.status(400).json({ error: "Укажите id пользователя" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const auth = await getGlobalAdmin(req, sql as { (strings: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]> })
  if (!auth) return res.status(403).json({ error: "Только глобальный админ может управлять организациями" })

  const target = await sql`SELECT id, username, tenant_id, frozen FROM app_users WHERE id = ${id} LIMIT 1`
  const t = target[0] as { id: string; username: string; tenant_id: string | null; frozen: boolean } | undefined
  if (!t) return res.status(404).json({ error: "Пользователь не найден" })
  if (t.tenant_id == null) return res.status(403).json({ error: "Нельзя удалить глобального админа" })

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM app_users WHERE tenant_id = ${t.tenant_id}`
      await sql`DELETE FROM tenants WHERE id = ${t.tenant_id}`
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error("Management delete:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  if (req.method === "PATCH") {
    try {
      const body = (req.body ?? {}) as { username?: string; password?: string; frozen?: boolean }
      const hasUsername = typeof body.username === "string"
      const hasPassword = typeof body.password === "string" && body.password.length > 0
      const hasFrozen = typeof body.frozen === "boolean"
      if (!hasUsername && !hasPassword && !hasFrozen) {
        return res.status(400).json({ error: "Укажите username, password или frozen" })
      }

      if (hasUsername) {
        const u = body.username.trim()
        if (u.length < 2) return res.status(400).json({ error: "Логин минимум 2 символа" })
        const existing = await sql`SELECT id FROM app_users WHERE username = ${u} AND id != ${id} LIMIT 1`
        if (existing.length > 0) return res.status(400).json({ error: "Логин уже занят" })
        await sql`UPDATE app_users SET username = ${u} WHERE id = ${id}`
      }

      if (hasPassword) {
        if (body.password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" })
        const bcrypt = (await import("bcryptjs")).default
        const hash = await bcrypt.hash(body.password, 10)
        await sql`UPDATE app_users SET password_hash = ${hash} WHERE id = ${id}`
      }

      if (hasFrozen) {
        await sql`UPDATE app_users SET frozen = ${body.frozen} WHERE id = ${id}`
      }

      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error("Management patch:", err)
      return res.status(500).json({ error: String((err as Error).message) })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
