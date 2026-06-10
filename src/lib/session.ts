import type { UserSession } from "@/lib/auth";

const SESSION_KEY = "lexpanel_session";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

interface StoredSession {
  user: UserSession;
  expiresAt: number;
}

// In-memory cache — clears on page close (más seguro que localStorage)
let _memSession: StoredSession | null = null;

function now() {
  return Date.now();
}

export const session = {
  set(user: UserSession, rememberMe = false): void {
    const expiresAt = now() + SESSION_TTL_MS;
    _memSession = { user, expiresAt };
    const stored: StoredSession = { user, expiresAt };
    // sessionStorage: se borra al cerrar la pestaña
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    // localStorage solo si "recordarme" está activo (TTL más largo)
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...stored,
        expiresAt: now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      }));
    }
  },

  get(): UserSession | null {
    // 1. Verificar memoria primero
    if (_memSession) {
      if (_memSession.expiresAt > now()) return _memSession.user;
      _memSession = null;
    }
    // 2. Recuperar de sessionStorage
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const stored: StoredSession = JSON.parse(raw);
      if (stored.expiresAt <= now()) {
        session.clear();
        return null;
      }
      _memSession = stored;
      return stored.user;
    } catch {
      return null;
    }
  },

  refresh(): void {
    const user = session.get();
    if (!user) return;
    session.set(user, !!localStorage.getItem(SESSION_KEY));
  },

  clear(): void {
    _memSession = null;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    // Mantener lexpanel_user por compatibilidad hasta que se elimine completamente
    localStorage.removeItem("lexpanel_user");
  },

  isValid(): boolean {
    return session.get() !== null;
  },

  getExpiresAt(): number | null {
    if (_memSession?.expiresAt) return _memSession.expiresAt;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return (JSON.parse(raw) as StoredSession).expiresAt;
    } catch {
      return null;
    }
  },

  getRemainingMs(): number {
    const exp = session.getExpiresAt();
    if (!exp) return 0;
    return Math.max(0, exp - now());
  },
};
