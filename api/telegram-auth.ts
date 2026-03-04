import { createHash, createHmac } from "crypto"
import * as admin from "firebase-admin"
import type { VercelRequest, VercelResponse } from "@vercel/node"

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

  if (!admin.apps.length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!key) {
      return res.status(500).json({ error: "Server misconfigured" })
    }
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(key)) })
  }

  const telegramId = data.id
  const uid = `tg_${telegramId}`

  const username = data.username
    ? String(data.username).trim().toLowerCase().replace(/^@/, "") || null
    : null

  const customToken = await admin.auth().createCustomToken(uid, {
    telegram_id: telegramId,
    username,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    photo_url: data.photo_url || null,
  })

  return res.status(200).json({ token: customToken })
}
