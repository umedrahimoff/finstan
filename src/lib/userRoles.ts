import { apiFetch } from "@/api/client"

export type UserRole = "admin" | "moderator"

export interface AppUser {
  uid: string
  telegramId: string
  username: string | null
  displayName: string | null
  role: UserRole | null
}

export interface UserProfile {
  uid: string
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  photoURL: string | null
  phone: string | null
  role: UserRole | null
}

export interface UserInvite {
  id: string
  username: string
  role: UserRole | null
  createdBy: string
  createdAt: string
}

export async function getAllUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>("/users")
}

export async function setUserRole(
  targetUid: string,
  role: UserRole | null,
  _currentUserUid: string
): Promise<void> {
  await apiFetch("/users/set-role", {
    method: "POST",
    body: JSON.stringify({ targetUid, role }),
  })
}

export async function createInvite(
  username: string,
  role: UserRole | null,
  _currentUserUid: string
): Promise<void> {
  await apiFetch("/invites", {
    method: "POST",
    body: JSON.stringify({ username, role }),
  })
}

export async function getAllInvites(): Promise<UserInvite[]> {
  return apiFetch<UserInvite[]>("/invites")
}

export async function deleteInviteById(
  inviteId: string,
  _currentUserUid: string
): Promise<void> {
  await apiFetch(`/invites/${inviteId}`, { method: "DELETE" })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profile = await apiFetch<UserProfile | null>("/profile")
  return profile?.uid === uid ? profile : null
}

export async function updateUserProfile(
  _uid: string,
  data: { firstName?: string | null; lastName?: string | null; phone?: string | null }
): Promise<void> {
  await apiFetch("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
