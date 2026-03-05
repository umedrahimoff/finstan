import type { VercelRequest, VercelResponse } from "@vercel/node"
import bcrypt from "bcryptjs"
import { createToken } from "../../lib/jwt"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL not set")
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }
    const u = (username ?? "").trim()
    const p = password ?? ""
    if (!u || !p) {
      return res.status(400).json({ error: "Введите логин и пароль" })
    }
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    const rows = await sql`SELECT id, username, password_hash FROM app_users WHERE username = ${u} LIMIT 1`
    const user = rows[0] as { id: string; username: string; password_hash: string } | undefined
    if (!user || !(await bcrypt.compare(p, user.password_hash))) {
      return res.status(401).json({ error: "Неверный логин или пароль" })
    }
    const token = await createToken({ uid: user.id, username: user.username })
    return res.status(200).json({ token })
  } catch (err) {
    console.error("Login:", err)
    return res.status(500).json({ error: "Ошибка сервера" })
  }
}
