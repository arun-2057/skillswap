import { create } from "zustand";

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatar: string | null;
    timezone: string;
    creditBalance: number;
    skillsOffered: string[];
    skillsWanted: string[];
    averageRating: number;
    isOnboarded: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
