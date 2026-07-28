"use client";

import React, { createContext, useContext } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/constants";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.markiti.co.ke/api/v1/";
const LOGIN_URL = `${API_BASE_URL}auth/login`;

export interface User {
  id: string;
  names: string;
  email?: string;
  phonenumber?: string;
  role?: { name: string };
  organisation_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string;
  /** True once localStorage has actually been checked on the client.
   *  Use this — not `user === null` — to decide whether to redirect to
   *  /login, or you'll bounce already-logged-in users on every page load. */
  hydrated: boolean;
  signin: (data: { username: string; password: string }) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser, userHydrated] = useLocalStorage<User | null>(
    STORAGE_KEYS.user,
    null,
  );
  const [token, setToken] = useLocalStorage<string>(STORAGE_KEYS.token, "");
  const [, setRefreshToken] = useLocalStorage<string>(
    STORAGE_KEYS.refreshToken,
    "",
  );

  const signin = async (data: { username: string; password: string }) => {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, client: "web" }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.message || "Invalid credentials");
    }

    const result = await response.json();
    setUser(result.user);
    setToken(result.access_token);
    setRefreshToken(result.refresh_token);
  };

  const signout = () => {
    setUser(null);
    setToken("");
    setRefreshToken("");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, token, hydrated: userHydrated, signin, signout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
