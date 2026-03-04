import { createHash, createHmac } from "crypto"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sql } from "../lib/db"
import { createToken } from "../lib/jwt"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GLOBAL_ADMIN_TG_ID = process.env.TELEGRAM_GLOBAL_ADMIN_ID || ""

function checkTelegramAuth(data: Record<string, string>): boolean {
  const { hash, ...rest } = data
  if (!hash || !BOT_TOKEN) return false
  const secret = createHash("sha256").update(BOT_TOKEN).digest()
  const checkString = Object.keys(rest)
    .sort()
    .filter((k) => rest[k])
    .map((k) => `${k}=${rest[k]}`)
    .join("\n")
  const hmac = createHmac("sha256", secret).update(checkString).digest("hex")
  return hmac === hash
}

function isGlobalAdmin(telegramId: string): boolean {
  return !!telegramId && telegramId === GLOBAL_ADMIN_TG_ID
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const data = req.body as Record<string, string>
  if (!data?.id || !data?.hash || !data?.auth_date) {
    return res.status(400).json({ error: "Invalid Telegram auth data" })
  }

  const authDate = parseInt(data.auth_date, 10)
  if (Date.now() / 1000 - authDate > 86400) {
    return res.status(400).json({ error: "Auth data expired" })
  }

  if (!checkTelegramAuth(data)) {
    return res.status(401).json({ error: "Invalid signature" })
  }

  const telegramId = data.id
  const uid = `tg_${telegramId}`
  const username = data.username
    ? String(data.username).trim().toLowerCase().replace(/^@/, "") || null
    : null
  const firstName = data.first_name || null
  const lastName = data.last_name || null
  const photoUrl = data.photo_url || null
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null

  const existing = await sql`SELECT * FROM users WHERE id = ${uid} LIMIT 1`
  const existingUser = existing[0] as Record<string, unknown> | undefined

  if (existingUser) {
    const role =
      isGlobalAdmin(telegramId) || isGlobalAdmin((existingUser.telegram_id as string) ?? "")
        ? "admin"
        : (existingUser.role as string) ?? null

    await sql`
      UPDATE users SET
        username = ${username},
        first_name = ${firstName},
        last_name = ${lastName},
        display_name = ${displayName},
        photo_url = ${photoUrl},
        role = ${role},
        updated_at = NOW()
      WHERE id = ${uid}
    `
  } else if (isGlobalAdmin(telegramId)) {
    await sql`
      INSERT INTO users (id, telegram_id, username, first_name, last_name, display_name, photo_url, role)
      VALUES (${uid}, ${telegramId}, ${username}, ${firstName}, ${lastName}, ${displayName}, ${photoUrl}, 'admin')
    `
  } else {
    const invite = username
      ? await sql`SELECT * FROM invites WHERE username = ${username} LIMIT 1`
      : []
    const inv = invite[0] as Record<string, unknown> | undefined

    if (!inv) {
      return res.status(403).json({ error: "INVITE_REQUIRED" })
    }

    await sql`
      INSERT INTO users (id, telegram_id, username, first_name, last_name, display_name, photo_url, role)
      VALUES (${uid}, ${telegramId}, ${username}, ${firstName}, ${lastName}, ${displayName}, ${photoUrl}, ${inv.role as string})
    `
    await sql`DELETE FROM invites WHERE id = ${inv.id as string}`
  }

  const token = await createToken({
    uid,
    telegramId,
    username,
    firstName,
    lastName,
    photoUrl,
  })

  return res.status(200).json({ token })
}
