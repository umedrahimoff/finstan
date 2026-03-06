import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const url = process.env.DATABASE_URL
  const secret = process.env.JWT_SECRET
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  if (!secret) return res.status(500).json({ error: "JWT_SECRET not set" })
  try {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }
    const u = (username ?? "").trim()
    const p = password ?? ""
    if (!u || !p) {
      return res.status(400).json({ error: "Введите логин и пароль" })
    }
    const bcrypt = (await import("bcryptjs")).default
    const { neon } = await import("@neondatabase/serverless")
    const { createToken } = await import("../../lib/jwt.js")
    const sql = neon(url)
    const rows = await sql`SELECT id, username, password_hash, role, frozen FROM app_users WHERE username = ${u} LIMIT 1`
    const user = rows[0] as { id: string; username: string; password_hash: string; role?: string; frozen?: boolean } | undefined
    if (!user || !(await bcrypt.compare(p, user.password_hash))) {
      return res.status(401).json({ error: "Неверный логин или пароль" })
    }
    if (user.frozen === true) {
      return res.status(403).json({ error: "Учётная запись заблокирована" })
    }
    const token = await createToken({ uid: user.id, username: user.username, role: user.role ?? "moderator" })
    return res.status(200).json({ token })
  } catch (err) {
    console.error("Login:", err)
    return res.status(500).json({ error: String((err as Error).message) })
  }
}
