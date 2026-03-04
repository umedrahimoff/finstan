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
  email: string | null
  displayName: string | null
  role: UserRole | null
}

export interface UserProfile {
  uid: string
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  photoURL: string | null
  phone: string | null
  role: UserRole | null
}

const USERS_COLLECTION = "users"
const INVITES_COLLECTION = "invites"
const GLOBAL_ADMIN_EMAIL = "thisisumed@gmail.com"

function isGlobalAdmin(email: string | null): boolean {
  return email?.trim().toLowerCase() === GLOBAL_ADMIN_EMAIL
}

function parseDisplayName(displayName: string | null): [string | null, string | null] {
  if (!displayName?.trim()) return [null, null]
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], null]
  return [parts[0], parts.slice(1).join(" ")]
}

export async function ensureUserDoc(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL?: string | null
): Promise<UserRole | null> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    const [firstName, lastName] = parseDisplayName(displayName)
    const role = isGlobalAdmin(email)
      ? "admin"
      : ((data.role as UserRole) ?? null)
    await setDoc(
      userRef,
      {
        email,
        displayName,
        firstName: firstName ?? data.firstName,
        lastName: lastName ?? data.lastName,
        photoURL: photoURL ?? null,
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    return role
  }

  const invite = await getInviteByEmail(email)
  if (invite) {
    const [firstName, lastName] = parseDisplayName(displayName)
    await setDoc(userRef, {
      email,
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

  if (isGlobalAdmin(email)) {
    const [firstName, lastName] = parseDisplayName(displayName)
    await setDoc(userRef, {
      email,
      displayName,
      firstName,
      lastName,
      photoURL: photoURL ?? null,
      role: "admin",
      updatedAt: new Date().toISOString(),
    })
    return "admin"
  }

  const adminsQuery = query(
    collection(db, USERS_COLLECTION),
    where("role", "==", "admin")
  )
  const adminsSnap = await getDocs(adminsQuery)
  if (!adminsSnap.empty) {
    throw new Error("INVITE_REQUIRED")
  }

  const [firstName, lastName] = parseDisplayName(displayName)
  await setDoc(userRef, {
    email,
    displayName,
    firstName,
    lastName,
    photoURL: photoURL ?? null,
    role: "admin",
    updatedAt: new Date().toISOString(),
  })
  return "admin"
}

export async function getCurrentUserRole(uid: string): Promise<UserRole | null> {
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (!userSnap.exists()) return null
  const data = userSnap.data()
  if (isGlobalAdmin(data.email ?? null)) return "admin"
  return (data.role as UserRole) ?? null
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      role: (data.role as UserRole) ?? null,
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
  const targetEmail = (targetData.email as string) ?? null
  if (targetData.role === "admin" || isGlobalAdmin(targetEmail)) {
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
  email: string
  role: UserRole | null
  createdBy: string
  createdAt: string
}

async function getInviteByEmail(email: string | null): Promise<(UserInvite & { id: string }) | null> {
  if (!email?.trim()) return null
  const normalized = email.trim().toLowerCase()
  const q = query(
    collection(db, INVITES_COLLECTION),
    where("email", "==", normalized)
  )
  const snap = await getDocs(q)
  const doc = snap.docs[0]
  if (!doc) return null
  const d = doc.data()
  return {
    id: doc.id,
    email: d.email,
    role: (d.role as UserRole) ?? null,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
  }
}

async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, INVITES_COLLECTION, inviteId))
}

export async function createInvite(
  email: string,
  role: UserRole | null,
  currentUserUid: string
): Promise<void> {
  const currentRole = await getCurrentUserRole(currentUserUid)
  if (currentRole !== "admin") {
    throw new Error("Только администратор может приглашать пользователей")
  }
  const normalized = email.trim().toLowerCase()
  if (!normalized) throw new Error("Введите email")

  const q = query(
    collection(db, INVITES_COLLECTION),
    where("email", "==", normalized)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    throw new Error("Приглашение для этого email уже существует")
  }

  const usersWithEmail = query(
    collection(db, USERS_COLLECTION),
    where("email", "==", normalized)
  )
  const usersSnap = await getDocs(usersWithEmail)
  if (!usersSnap.empty) {
    throw new Error("Пользователь с этим email уже зарегистрирован")
  }

  await addDoc(collection(db, INVITES_COLLECTION), {
    email: normalized,
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
      email: data.email,
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
    email: d.email ?? null,
    firstName: d.firstName ?? null,
    lastName: d.lastName ?? null,
    displayName: d.displayName ?? null,
    photoURL: d.photoURL ?? null,
    phone: d.phone ?? null,
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
