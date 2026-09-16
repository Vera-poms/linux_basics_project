import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, ApiError } from "../api/client";

export interface AuthUser {
  id: number;
  email: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  /** True while the token from a previous session is still being validated. */
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const TOKEN_KEY = "linux-basics:token";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiFetch<AuthUser>("/auth/me", { token })
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applyToken = useCallback((res: TokenResponse) => {
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(TOKEN_KEY, res.access_token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await apiFetch<TokenResponse>("/auth/login", { method: "POST", body: { email, password } });
        applyToken(res);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not sign in.");
        throw e;
      }
    },
    [applyToken]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await apiFetch<TokenResponse>("/auth/register", { method: "POST", body: { email, password } });
        applyToken(res);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not create an account.");
        throw e;
      }
    },
    [applyToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isLoading, error, login, register, logout, clearError }),
    [token, user, isLoading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
