import { SignJWT, jwtVerify } from "jose"

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error("JWT_SECRET not set")
  return new TextEncoder().encode(s)
}

export interface JwtPayload {
  uid: string
  username: string
}

export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
