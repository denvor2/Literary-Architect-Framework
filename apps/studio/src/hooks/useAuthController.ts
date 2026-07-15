"use client";

import { useEffect, useState } from "react";

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
};

export type AuthState = {
  isLoggedIn: boolean;
  user?: User;
  error?: string;
  isLoading: boolean;
};

export function useAuthController() {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
  });

  // On mount: fetch current user from GET /api/auth/me (restore session from cookies)
  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include cookies (CRITICAL for session restoration)
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store", // Don't cache auth responses
        });

        if (cancelled) return;

        if (response.ok) {
          const data = (await response.json()) as {
            ok: boolean;
            id: string;
            email: string;
            role: "admin" | "user";
            isBlocked: boolean;
          };

          // User is authenticated - session restored from cookies
          setAuth({
            isLoggedIn: true,
            user: {
              id: data.id,
              email: data.email,
              role: data.role,
              isBlocked: data.isBlocked,
            },
            isLoading: false,
          });
        } else {
          // 401 Unauthorized - no valid session in cookies
          setAuth({ isLoggedIn: false, isLoading: false });
        }
      } catch (error) {
        if (cancelled) return;
        console.warn("Session restoration failed (user not authenticated):", error);
        setAuth({ isLoggedIn: false, isLoading: false });
      }
    }

    void fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuth((prev) => ({ ...prev, error: undefined }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        id?: string;
        email?: string;
        role?: "admin" | "user";
      };

      if (!response.ok) {
        setAuth((prev) => ({
          ...prev,
          error: data.error || "Login failed",
        }));
        return false;
      }

      setAuth({
        isLoggedIn: true,
        user: {
          id: data.id || "",
          email: data.email || "",
          role: data.role || "user",
          isBlocked: false,
        },
        isLoading: false,
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setAuth((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    captchaToken: string,
  ) => {
    setAuth((prev) => ({ ...prev, error: undefined }));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({ email, password, captchaToken }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        id?: string;
        email?: string;
        role?: "admin" | "user";
        isBlocked?: boolean;
      };

      if (!response.ok) {
        setAuth((prev) => ({
          ...prev,
          error: data.error || "Registration failed",
        }));
        return false;
      }

      // After registration, automatically log in
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const loginData = (await loginResponse.json()) as {
        ok: boolean;
        error?: string;
        id?: string;
        email?: string;
        role?: "admin" | "user";
      };

      if (loginResponse.ok) {
        setAuth({
          isLoggedIn: true,
          user: {
            id: loginData.id || data.id || "",
            email: loginData.email || data.email || "",
            role: loginData.role || data.role || "user",
            isBlocked: data.isBlocked || false,
          },
          isLoading: false,
        });
        return true;
      }

      // If auto-login fails, still consider registration successful
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      setAuth((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setAuth({
        isLoggedIn: false,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear auth state even if logout fails
      setAuth({
        isLoggedIn: false,
        isLoading: false,
      });
      return false;
    }
  };

  return {
    auth,
    login,
    register,
    logout,
  };
}
