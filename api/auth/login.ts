import type { VercelRequest, VercelResponse } from "@vercel/node"
import bcrypt from "bcryptjs"
import { createToken } from "../../lib/jwt"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL not set")
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(url)
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    const { username, password } = req.body as { username?: string; password?: string }
    const u = (username ?? "").trim().toLowerCase()
    const p = password ?? ""

    if (!u || !p) {
      return res.status(400).json({ error: "Введите логин и пароль" })
    }

    const rows = await sql`SELECT * FROM app_users WHERE username = ${u} LIMIT 1`
    const user = rows[0] as Record<string, unknown> | undefined
    if (!user) {
      return res.status(401).json({ error: "Неверный логин или пароль" })
    }

    const ok = await bcrypt.compare(p, user.password_hash as string)
    if (!ok) {
      return res.status(401).json({ error: "Неверный логин или пароль" })
    }

    const token = await createToken({
      uid: user.id as string,
      username: user.username as string,
    })

    return res.status(200).json({ token })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ error: "Ошибка сервера. Попробуйте позже." })
  }
}
