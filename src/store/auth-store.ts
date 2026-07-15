import { create } from "zustand";

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatar: string | null;
    timezone: string;
    skillsOffered: string[];
    skillsWanted: string[];
    averageRating: number;
    isOnboarded: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  setLoading: (loading: boolean) => void;
  logout: (signOutCallback?: (() => Promise<void> | void) | null) => void;
  setUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async (signOutCallback) => {
    await signOutCallback?.();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUnauthenticated: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
