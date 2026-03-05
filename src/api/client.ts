const API_BASE = import.meta.env.VITE_API_URL ?? "/api"

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    throw new Error("Не удалось подключиться. Попробуйте позже.")
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `API error: ${res.status}`)
  }
  return data as T
}
