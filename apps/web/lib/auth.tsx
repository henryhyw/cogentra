"use client";

import { useRouter } from "next/navigation";
import { createContext, startTransition, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, getStoredSession, setStoredSession, type AuthSession } from "./api";
import { completeEmailLinkSignIn, hasFirebaseConfig, requestEmailLink, signInWithGooglePopup } from "./firebase";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  demoLogin: (email?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  emailLinkLogin: (email: string) => Promise<void>;
  completeEmailLink: (email: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      demoLogin: async (email?: string) => {
        const result = await api.demoLogin(email);
        setStoredSession(result);
        setSession(result);
        startTransition(() => {
          router.push("/assignments");
        });
      },
      googleLogin: async () => {
        if (!hasFirebaseConfig()) {
          toast.error("Firebase Auth is not configured. Use demo mode or add Firebase env vars.");
          return;
        }
        const result = await signInWithGooglePopup();
        const idToken = await result.user.getIdToken();
        const sessionPayload: AuthSession = {
          token: idToken,
          userId: result.user.uid,
          email: result.user.email ?? "",
          displayName: result.user.displayName ?? "Reviewer",
          role: "reviewer",
          mode: "firebase",
        };
        setStoredSession(sessionPayload);
        setSession(sessionPayload);
        startTransition(() => {
          router.push("/assignments");
        });
      },
      emailLinkLogin: async (email: string) => {
        await requestEmailLink(email);
        toast.success(`Sign-in link sent to ${email}`);
      },
      completeEmailLink: async (email: string) => {
        const result = await completeEmailLinkSignIn(email);
        const idToken = await result.user.getIdToken();
        const sessionPayload: AuthSession = {
          token: idToken,
          userId: result.user.uid,
          email: result.user.email ?? email,
          displayName: result.user.displayName ?? "Reviewer",
          role: "reviewer",
          mode: "firebase",
        };
        setStoredSession(sessionPayload);
        setSession(sessionPayload);
      },
      signOut: () => {
        setStoredSession(null);
        setSession(null);
        startTransition(() => {
          router.push("/login");
        });
      },
    }),
    [loading, router, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
