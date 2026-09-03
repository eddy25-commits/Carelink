import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { getToken, setToken } from "../api/client";
import { healthWorkersApi } from "../api/healthWorkers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }
    healthWorkersApi
      .me()
      .then((res) => setWorker(res.data))
      .catch(() => setToken(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setWorker(res.worker);
    return res.worker;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setWorker(null);
  }, []);

  const value = useMemo(
    () => ({ worker, isLoading, isAuthenticated: !!worker, login, logout }),
    [worker, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
