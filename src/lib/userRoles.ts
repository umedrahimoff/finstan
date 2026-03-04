import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore"
import { db } from "./firebase"

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

const USERS_COLLECTION = "users"
const INVITES_COLLECTION = "invites"
const GLOBAL_ADMIN_TG_ID = import.meta.env.VITE_TELEGRAM_GLOBAL_ADMIN_ID || ""

function isGlobalAdmin(telegramId: string | null): boolean {
  return !!telegramId && telegramId === GLOBAL_ADMIN_TG_ID
}

function parseDisplayName(displayName: string | null): [string | null, string | null] {
  if (!displayName?.trim()) return [null, null]
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], null]
  return [parts[0], parts.slice(1).join(" ")]
}

export async function ensureUserDoc(
  uid: string,
  telegramId: string,
  username: string | null,
  firstName: string | null,
  lastName: string | null,
  photoURL?: string | null
): Promise<UserRole | null> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null

  if (userSnap.exists()) {
    const data = userSnap.data()
    const storedTgId = (data.telegramId as string) ?? null
    const [fn, ln] = parseDisplayName(displayName)
    let role = isGlobalAdmin(telegramId) || isGlobalAdmin(storedTgId)
      ? "admin"
      : ((data.role as UserRole) ?? null)
    if (!role && (isGlobalAdmin(telegramId) || isGlobalAdmin(storedTgId))) {
      const allSnap = await getDocs(collection(db, USERS_COLLECTION))
      if (allSnap.size === 1 && allSnap.docs[0].id === uid) role = "admin"
    }
    await setDoc(
      userRef,
      {
        telegramId,
        username,
        displayName,
        firstName: fn ?? data.firstName,
        lastName: ln ?? data.lastName,
        photoURL: photoURL ?? null,
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    return role
  }

  if (isGlobalAdmin(telegramId)) {
    await setDoc(userRef, {
      telegramId,
      username,
      displayName,
      firstName,
      lastName,
      photoURL: photoURL ?? null,
      role: "admin",
      updatedAt: new Date().toISOString(),
    })
    return "admin"
  }

  const invite = await getInviteByUsername(username)
  if (invite) {
    await setDoc(userRef, {
      telegramId,
      username,
      displayName,
      firstName,
      lastName,
      photoURL: photoURL ?? null,
      role: invite.role,
      updatedAt: new Date().toISOString(),
    })
    await deleteInvite(invite.id)
    return invite.role
  }

  throw new Error("INVITE_REQUIRED")
}

export async function getCurrentUserRole(uid: string): Promise<UserRole | null> {
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (!userSnap.exists()) return null
  const data = userSnap.data()
  const tgId = (data.telegramId as string) ?? null
  if (isGlobalAdmin(tgId)) return "admin"
  const role = (data.role as UserRole) ?? null
  if (role === "admin") return "admin"
  if (isGlobalAdmin(tgId)) {
    const allUsers = await getDocs(collection(db, USERS_COLLECTION))
    if (allUsers.size === 1 && allUsers.docs[0].id === uid) return "admin"
  }
  return role
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION))
  return snap.docs.map((d) => {
    const data = d.data()
    const tgId = (data.telegramId as string) ?? ""
    const storedRole = (data.role as UserRole) ?? null
    const role = isGlobalAdmin(tgId) ? "admin" : storedRole
    return {
      uid: d.id,
      telegramId: tgId,
      username: (data.username as string) ?? null,
      displayName: (data.displayName as string) ?? null,
      role,
    }
  })
}

export async function setUserRole(
  targetUid: string,
  role: UserRole | null,
  currentUserUid: string
): Promise<void> {
  const currentRole = await getCurrentUserRole(currentUserUid)
  if (currentRole !== "admin") {
    throw new Error("Только администратор может изменять роли")
  }

  const targetRef = doc(db, USERS_COLLECTION, targetUid)
  const targetSnap = await getDoc(targetRef)
  if (!targetSnap.exists()) {
    throw new Error("Пользователь не найден")
  }

  const targetData = targetSnap.data()
  const targetTgId = (targetData.telegramId as string) ?? null
  if (targetData.role === "admin" || isGlobalAdmin(targetTgId)) {
    throw new Error("Нельзя изменить роль администратора")
  }

  await setDoc(
    targetRef,
    { ...targetData, role, updatedAt: new Date().toISOString() },
    { merge: true }
  )
}

export interface UserInvite {
  id: string
  username: string
  role: UserRole | null
  createdBy: string
  createdAt: string
}

async function getInviteByUsername(
  username: string | null
): Promise<(UserInvite & { id: string }) | null> {
  if (!username?.trim()) return null
  const normalized = username.trim().toLowerCase().replace(/^@/, "")
  const q = query(
    collection(db, INVITES_COLLECTION),
    where("username", "==", normalized)
  )
  const snap = await getDocs(q)
  const d = snap.docs[0]
  if (!d) return null
  const data = d.data()
  return {
    id: d.id,
    username: data.username,
    role: (data.role as UserRole) ?? null,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  }
}

async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, INVITES_COLLECTION, inviteId))
}

export async function createInvite(
  username: string,
  role: UserRole | null,
  currentUserUid: string
): Promise<void> {
  const currentRole = await getCurrentUserRole(currentUserUid)
  if (currentRole !== "admin") {
    throw new Error("Только администратор может приглашать пользователей")
  }
  const normalized = username.trim().toLowerCase().replace(/^@/, "")
  if (!normalized) throw new Error("Введите username")

  const q = query(
    collection(db, INVITES_COLLECTION),
    where("username", "==", normalized)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    throw new Error("Приглашение для этого username уже существует")
  }

  const usersWithUsername = query(
    collection(db, USERS_COLLECTION),
    where("username", "==", normalized)
  )
  const usersSnap = await getDocs(usersWithUsername)
  if (!usersSnap.empty) {
    throw new Error("Пользователь с этим username уже зарегистрирован")
  }

  await addDoc(collection(db, INVITES_COLLECTION), {
    username: normalized,
    role,
    createdBy: currentUserUid,
    createdAt: new Date().toISOString(),
  })
}

export async function getAllInvites(): Promise<UserInvite[]> {
  const snap = await getDocs(collection(db, INVITES_COLLECTION))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      username: data.username,
      role: (data.role as UserRole) ?? null,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
    }
  })
}

export async function deleteInviteById(
  inviteId: string,
  currentUserUid: string
): Promise<void> {
  const currentRole = await getCurrentUserRole(currentUserUid)
  if (currentRole !== "admin") {
    throw new Error("Только администратор может удалять приглашения")
  }
  await deleteInvite(inviteId)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (!userSnap.exists()) return null
  const d = userSnap.data()
  return {
    uid: userSnap.id,
    telegramId: (d.telegramId as string) ?? "",
    username: (d.username as string) ?? null,
    firstName: (d.firstName as string) ?? null,
    lastName: (d.lastName as string) ?? null,
    displayName: (d.displayName as string) ?? null,
    photoURL: (d.photoURL as string) ?? null,
    phone: (d.phone as string) ?? null,
    role: (d.role as UserRole) ?? null,
  }
}

export async function updateUserProfile(
  uid: string,
  data: { firstName?: string | null; lastName?: string | null; phone?: string | null }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) throw new Error("Пользователь не найден")
  const current = userSnap.data()
  const displayName = [data.firstName ?? current.firstName, data.lastName ?? current.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || null
  await setDoc(
    userRef,
    {
      ...current,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      phone: data.phone ?? current.phone,
      displayName: displayName || current.displayName,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}
