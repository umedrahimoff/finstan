import type { VercelRequest, VercelResponse } from "@vercel/node"
import { verifyToken } from "../../lib/jwt.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "No token" })
  const payload = await verifyToken(token)
  if (!payload) return res.status(401).json({ error: "Invalid token" })
  return res.status(200).json({ uid: payload.uid, username: payload.username })
}
