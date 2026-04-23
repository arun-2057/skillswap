import { create } from "zustand";

export type AppRoute =
  | { page: "home" }
  | { page: "browse"; params?: Record<string, string> }
  | { page: "listing"; id: string }
  | { page: "create-listing"; editId?: string }
  | { page: "profile"; id?: string }
  | { page: "edit-profile" }
  | { page: "sessions" }
  | { page: "session"; id: string }
  | { page: "transactions" }
  | { page: "notifications" }
  | { page: "onboarding" };

interface RouterState {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  goBack: () => void;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  route: { page: "home" },
  navigate: (route) => {
    set({ route });
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  goBack: () => {
    const { route } = get();
    if (route.page === "listing" || route.page === "session" || route.page === "profile") {
      set({ route: { page: "browse" } });
    } else {
      set({ route: { page: "home" } });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
}));
