"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string, retries = 2) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

          if (data && !error) {
            setProfile(data);
            return;
          }

          if (error) {
            console.error("Gagal mengambil data profil:", error);
          }
        } catch (err) {
          console.error("Gagal mengambil data profil:", err);
        }

        // Beri waktu database membuat profil jika pengguna baru mendaftar.
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, 0);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // Ambil sesi awal pengguna
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Inisialisasi auth gagal:", err);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Berlangganan perubahan status autentikasi Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
