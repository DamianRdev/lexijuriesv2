import { useState, useEffect } from "react";
import { auth, type UserSession } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  const handleLogin = (email: string, pass: string) => {
    const session = auth.login(email, pass);
    if (session) {
      setUser(session);
    }
    return session;
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
  };
}
