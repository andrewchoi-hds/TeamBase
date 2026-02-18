import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types";

interface AuthStore {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isManagerOrAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAdmin: () => get().user?.role === "ADMIN",
      isManager: () => get().user?.role === "MANAGER",
      isManagerOrAdmin: () => {
        const role = get().user?.role;
        return role === "ADMIN" || role === "MANAGER";
      },
    }),
    { name: "auth-store" }
  )
);
