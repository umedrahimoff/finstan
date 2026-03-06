import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

async function getAuth(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" })

  const id = (req.query as { id?: string }).id
  if (!id) return res.status(400).json({ error: "Укажите id пользователя" })

  const auth = await getAuth(req)
  if (!auth) return res.status(401).json({ error: "Войдите в систему" })

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })

  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)

  const authRows = await sql`SELECT role, tenant_id FROM app_users WHERE id = ${auth.uid} AND frozen = false LIMIT 1`
  const authRow = authRows[0] as { role: string; tenant_id?: string | null } | undefined
  const authRole = authRow?.role ?? "moderator"
  const authTenantId = authRow?.tenant_id ?? null
  if (authRole !== "admin" && authRole !== "moderator") return res.status(403).json({ error: "Нет прав" })
  if (authTenantId == null) return res.status(403).json({ error: "Используйте раздел Управление" })

  if (id === auth.uid) return res.status(400).json({ error: "Нельзя удалить себя" })

  try {
    const target = await sql`SELECT role, tenant_id FROM app_users WHERE id = ${id} LIMIT 1`
    const t = target[0] as { role: string; tenant_id?: string | null } | undefined
    if (!t) return res.status(404).json({ error: "Пользователь не найден" })
    if (t.tenant_id !== authTenantId) return res.status(403).json({ error: "Нет доступа к этому пользователю" })
    if (t.role === "admin" && authRole !== "admin") return res.status(403).json({ error: "Только админ может удалить админа" })
    await sql`DELETE FROM app_users WHERE id = ${id}`
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error("User delete:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
