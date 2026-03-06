const KEY = "finstan_profile"

export interface UserProfile {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export function getProfile(uid: string): UserProfile {
  try {
    const data = localStorage.getItem(`${KEY}_${uid}`)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function setProfile(uid: string, profile: UserProfile): void {
  localStorage.setItem(`${KEY}_${uid}`, JSON.stringify(profile))
}
