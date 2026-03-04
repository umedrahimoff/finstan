import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sql } from "../../lib/db"
import { createToken } from "../../lib/jwt"

const GLOBAL_ADMIN_TG_ID = process.env.TELEGRAM_GLOBAL_ADMIN_ID || ""

function isGlobalAdmin(telegramId: string): boolean {
  return !!telegramId && telegramId === GLOBAL_ADMIN_TG_ID
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { state } = req.body as { state?: string }
  if (!state?.trim()) {
    return res.status(400).json({ error: "state required" })
  }

  const pending = await sql`
    SELECT * FROM auth_pending WHERE state = ${state.trim()} LIMIT 1
  `
  const row = pending[0] as Record<string, unknown> | undefined
  if (!row) {
    return res.status(400).json({ error: "Ссылка устарела или уже использована. Начните вход заново." })
  }

  const telegramId = String(row.telegram_id)
  const uid = `tg_${telegramId}`
  const username = (row.username as string) ?? null
  const firstName = (row.first_name as string) ?? null
  const lastName = (row.last_name as string) ?? null
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null

  await sql`DELETE FROM auth_pending WHERE state = ${state.trim()}`

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
        role = ${role},
        updated_at = NOW()
      WHERE id = ${uid}
    `
  } else if (isGlobalAdmin(telegramId)) {
    await sql`
      INSERT INTO users (id, telegram_id, username, first_name, last_name, display_name, role)
      VALUES (${uid}, ${telegramId}, ${username}, ${firstName}, ${lastName}, ${displayName}, 'admin')
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
      INSERT INTO users (id, telegram_id, username, first_name, last_name, display_name, role)
      VALUES (${uid}, ${telegramId}, ${username}, ${firstName}, ${lastName}, ${displayName}, ${inv.role as string})
    `
    await sql`DELETE FROM invites WHERE id = ${inv.id as string}`
  }

  const token = await createToken({
    uid,
    telegramId,
    username,
    firstName,
    lastName,
    photoUrl: null,
  })

  return res.status(200).json({ token })
}
