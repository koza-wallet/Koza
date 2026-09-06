"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

type CustomUser = User & { name?: string; image?: string; subscriptionTier?: string };

type SessionContextType = {
  data: { user: CustomUser | null } | null;
  loading: boolean;
};

const AuthContext = createContext<SessionContextType>({ data: null, loading: true });

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: User | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Helper untuk memetakan Supabase User ke bentuk NextAuth User lama
    const mapUser = (user: User | null) => {
      if (!user) return null;
      return {
        ...user,
        name: user.user_metadata?.full_name || user.email?.split("@")[0],
        image: user.user_metadata?.avatar_url,
      } as User & { name?: string; image?: string; subscriptionTier?: string };
    };

    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSession({ user: mapUser(user) });
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession({ user: mapUser(session?.user || null) });
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ data: session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Kompatibilitas dengan kode NextAuth lama
export function useSession() {
  return useContext(AuthContext);
}

// Kompatibilitas untuk logout
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/auth/login";
}
