import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  api,
  acceptSession,
  currentSession,
  loadSession,
  subscribeSession,
} from "../lib/api";
export type UserRole = "owner" | "admin" | "member" | "guest";
interface AuthContextType {
  user: any;
  role: UserRole;
  realRole: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  isTeacher: boolean;
  isKepsek: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  visitorId: string;
  currentStudent: any;
  hasCreatedCard: boolean;
  isCreateCardOpen: boolean;
  createCardReason: string | null;
  openCreateCard: (reason?: string) => void;
  closeCreateCard: () => void;
  refreshStudent: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState(currentSession),
    [loading, setLoading] = useState(true),
    [isCreateCardOpen, setCreate] = useState(false),
    [createCardReason, setReason] = useState<string | null>(null);
  useEffect(() => {
    const off = subscribeSession(setSession);
    void loadSession()
      .catch(() => {})
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void loadSession().catch(() => {});
    }, 60000);
    let lastActive = Date.now(),
      lastRenew = 0;
    const activity = () => {
      lastActive = Date.now();
    };
    const renew = setInterval(() => {
      if (
        currentSession().user &&
        document.visibilityState === "visible" &&
        Date.now() - lastActive < 300000 &&
        Date.now() - lastRenew >= 300000
      ) {
        lastRenew = Date.now();
        void api("/auth/renew", {}).catch(() => {});
      }
    }, 30000);
    const visible = () => {
      if (document.visibilityState === "visible")
        void loadSession().catch(() => {});
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    document.addEventListener("visibilitychange", visible);
    return () => {
      off();
      clearInterval(timer);
      clearInterval(renew);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  const signOut = useCallback(async () => {
    await api("/auth/logout", {});
    acceptSession({ user: null, profile: null, csrfToken: null });
  }, []);
  const user = session.user,
    role: UserRole = user?.role || "guest";
  const currentStudent = session.profile;
  const refreshStudent = useCallback(async () => {
    await loadSession();
  }, []);
  const value: AuthContextType = {
    user,
    role,
    realRole: role,
    isAdmin: ["owner", "admin"].includes(role),
    isModerator: ["owner", "admin"].includes(role),
    isTeacher: user?.profileKind === "teacher",
    isKepsek:
      user?.profileKind === "teacher" &&
      /kepala/i.test(currentStudent?.jabatan || ""),
    loading,
    signOut,
    visitorId: user?.uid || "GUEST",
    currentStudent,
    hasCreatedCard: !!(
      currentStudent?.cardCreated ||
      currentStudent?.hasCreatedCard ||
      currentStudent?.isTeacher
    ),
    isCreateCardOpen,
    createCardReason,
    openCreateCard: (reason) => {
      setReason(reason || null);
      setCreate(true);
    },
    closeCreateCard: () => {
      setCreate(false);
      setReason(null);
    },
    refreshStudent,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
