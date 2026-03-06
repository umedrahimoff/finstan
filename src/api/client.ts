const API_BASE = import.meta.env.VITE_API_URL ?? "/api"

export function getToken(): string | null {
  return localStorage.getItem("finstan_token")
}

export function setToken(token: string): void {
  localStorage.setItem("finstan_token", token)
}

export function clearToken(): void {
  localStorage.removeItem("finstan_token")
}

export async function apiFetch<T>(path: string, options?: RequestInit & { token?: string | null }): Promise<T> {
  const token = options?.token ?? getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const { token: _, ...rest } = options ?? {}
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) throw new Error(text || `API error: ${res.status}`)
    throw new Error("Ошибка соединения")
  }
  if (!res.ok) {
    const errMsg = (data as { error?: string }).error
    throw new Error(errMsg || text || `API error: ${res.status}`)
  }
  return data as T
}
