import { create } from "zustand";

export type AppRoute =
  | { page: "home"; tab?: "signin" | "signup" }
  | { page: "browse"; params?: Record<string, string> }
  | { page: "listing"; id: string }
  | { page: "create-listing"; editId?: string }
  | { page: "profile"; id?: string }
  | { page: "edit-profile" }
  | { page: "sessions" }
  | { page: "session"; id: string }
  | { page: "notifications" }
  | { page: "messages"; conversationId?: string }
  | { page: "onboarding" };

interface RouterState {
  route: AppRoute;
  openedAsModal: boolean;
  navigate: (route: AppRoute, options?: { asModal?: boolean }) => void;
  goBack: () => void;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  route: { page: "home" },
  openedAsModal: false,
  navigate: (route, options) => {
    const isModalNavigation =
      options?.asModal === true &&
      (route.page === "listing" || route.page === "session");

    const safeRoute: AppRoute =
      route.page === "home" ? { page: "home", tab: route.tab } : route;

    set({
      route: safeRoute,
      openedAsModal: isModalNavigation,
    });

    if (!isModalNavigation) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  goBack: () => {
    const { route, openedAsModal } = get();

    if (openedAsModal) {
      if (route.page === "listing" || route.page === "session") {
        set({ route: { page: "browse" }, openedAsModal: false });
      } else {
        set({ route: { page: "home" }, openedAsModal: false });
      }
      return;
    }

    if (route.page === "listing" || route.page === "session" || route.page === "profile") {
      set({ route: { page: "browse" }, openedAsModal: false });
    } else {
      set({ route: { page: "home" }, openedAsModal: false });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
}));
