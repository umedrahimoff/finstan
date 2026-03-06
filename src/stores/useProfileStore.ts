import { create } from "zustand"
import { getProfile, setProfile, type UserProfile } from "@/lib/profileStorage"

interface ProfileStore {
  profile: UserProfile
  load: (uid: string) => void
  save: (uid: string, profile: UserProfile) => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: {},
  load: (uid) => set({ profile: getProfile(uid) }),
  save: (uid, profile) => {
    setProfile(uid, profile)
    set({ profile })
  },
}))
