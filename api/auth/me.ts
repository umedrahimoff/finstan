import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt"

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

  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ error: "DATABASE_URL not set" })
  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(url)
  const rows = await sql`SELECT * FROM app_users WHERE id = ${payload.uid} LIMIT 1`
  const u = rows[0] as Record<string, unknown> | undefined
  if (!u) {
    return res.status(401).json({ error: "User not found" })
  }
  return res.status(200).json({
    uid: u.id,
    username: u.username,
    displayName: u.username,
    role: null,
  })
}
