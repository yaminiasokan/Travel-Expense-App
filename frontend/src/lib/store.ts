"use client";

import { create } from "zustand";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (access: string) => void;
  logout: () => void;
  hydrate: () => void;
}

const ACCESS_KEY = "waypoint.access";
const REFRESH_KEY = "waypoint.refresh";
const USER_KEY = "waypoint.user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  setAuth: (user, access, refresh) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
      window.localStorage.setItem(REFRESH_KEY, refresh);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, accessToken: access, refreshToken: refresh });
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },

  setAccessToken: (access) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
    }
    set({ accessToken: access });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const access = window.localStorage.getItem(ACCESS_KEY);
    const refresh = window.localStorage.getItem(REFRESH_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);
    set({
      accessToken: access,
      refreshToken: refresh,
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
      hydrated: true,
    });
  },
}));
