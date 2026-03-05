import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production"
)
const EXP = "7d"

export interface JwtPayload {
  uid: string
  telegramId?: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  photoUrl?: string | null
}

export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(EXP)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
