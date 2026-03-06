/**
 * Установка webhook для Telegram бота.
 * Запуск: VERCEL_URL=finstan.vercel.app npm run telegram:webhook
 */
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "..", ".env")
try {
  const env = readFileSync(envPath, "utf8")
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim()
  }
} catch {}

const token = process.env.TELEGRAM_BOT_TOKEN
const baseUrl = process.env.VERCEL_URL || process.env.APP_URL

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN required")
  process.exit(1)
}
if (!baseUrl) {
  console.error("VERCEL_URL or APP_URL required (e.g. your-app.vercel.app)")
  process.exit(1)
}

const webhookUrl = `https://${baseUrl.replace(/^https?:\/\//, "")}/api/telegram/webhook`
console.log("Setting webhook:", webhookUrl)

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: webhookUrl }),
})

const json = await res.json()
if (!json.ok) {
  console.error("Error:", json)
  process.exit(1)
}
console.log("Webhook set successfully")
