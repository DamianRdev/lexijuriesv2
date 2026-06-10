import { session } from "@/lib/session";
import { audit } from "@/lib/audit";
import { jwtSim } from "@/lib/token";
import { totp } from "@/lib/totp";
import { rateLimit } from "@/lib/rateLimit";

export interface UserSession {
  email: string;
  nombre: string;
  role: "Socio" | "Asociado";
  iniciales: string;
  abogadoId: string;
}

export type LoginStep1Result =
  | { status: "2fa_required"; tempToken: string }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "rate_limited"; lockedUntil: number };

const isClient = typeof window !== "undefined";

const USERS: Record<string, { pass: string; session: UserSession }> = {
  "laura@lexpanel.com": {
    pass: "laura",
    session: { email: "laura@lexpanel.com", nombre: "Dra. Laura Méndez", role: "Socio", iniciales: "LM", abogadoId: "lm" },
  },
  "carlos@lexpanel.com": {
    pass: "carlos",
    session: { email: "carlos@lexpanel.com", nombre: "Dr. Carlos Herrera", role: "Asociado", iniciales: "CH", abogadoId: "ch" },
  },
};

export const auth = {
  getUser: (): UserSession | null => {
    if (!isClient) return null;
    const sessionUser = session.get();
    if (sessionUser) return sessionUser as UserSession;
    // Migrate legacy localStorage key
    try {
      const data = localStorage.getItem("lexpanel_user");
      if (!data) return null;
      const user = JSON.parse(data) as UserSession;
      session.set(user);
      localStorage.removeItem("lexpanel_user");
      return user;
    } catch {
      return null;
    }
  },

  // Step 1: check rate limit → validate credentials → issue short-lived 2FA token
  loginStep1: (email: string, pass: string): LoginStep1Result => {
    if (!isClient) return { status: "invalid", attemptsLeft: 5 };

    const rate = rateLimit.check(email);
    if (!rate.allowed) {
      return { status: "rate_limited", lockedUntil: rate.lockedUntil! };
    }

    const entry = USERS[email.toLowerCase().trim()];
    if (!entry || entry.pass !== pass) {
      const result = rateLimit.fail(email);
      if (result.locked) {
        audit.log("2fa_required", email, "unknown", `rate_limited_until:${result.lockedUntil}`);
      }
      return { status: "invalid", attemptsLeft: result.attemptsLeft };
    }

    const { session: u } = entry;
    const tempToken = jwtSim.generate(
      { sub: u.email, name: u.nombre, role: u.role, iniciales: u.iniciales, abogadoId: u.abogadoId },
      5 * 60 * 1000,
    );
    audit.log("2fa_required", u.email, u.role);
    return { status: "2fa_required", tempToken };
  },

  // Step 2: verify OTP → create session → reset rate limit
  loginStep2: (tempToken: string, code: string, rememberMe = false): UserSession | null => {
    if (!isClient) return null;
    const claims = jwtSim.verify(tempToken);
    if (!claims) return null;
    if (!totp.verify(claims.sub, code)) {
      audit.log("2fa_failed", claims.sub, claims.role);
      return null;
    }
    const user: UserSession = {
      email: claims.sub,
      nombre: claims.name,
      role: claims.role,
      iniciales: claims.iniciales,
      abogadoId: claims.abogadoId,
    };
    session.set(user, rememberMe);
    rateLimit.reset(claims.sub);
    audit.log("2fa_success", user.email, user.role, `rememberMe=${rememberMe}`);
    return user;
  },

  logout: () => {
    if (!isClient) return;
    const user = auth.getUser();
    if (user) audit.log("logout", user.email, user.role);
    session.clear();
  },

  isAuthenticated: (): boolean => auth.getUser() !== null,

  can: (action: "manage_causas" | "view_all_causas" | "manage_equipo" | "view_audit"): boolean => {
    const user = auth.getUser();
    if (!user) return false;
    const isSocio = user.role === "Socio";
    switch (action) {
      case "manage_causas":   return isSocio;
      case "view_all_causas": return isSocio;
      case "manage_equipo":   return isSocio;
      case "view_audit":      return isSocio;
      default:                return false;
    }
  },

  canViewCausa: (causaAbogadoId: string): boolean => {
    const user = auth.getUser();
    if (!user) return false;
    if (user.role === "Socio") return true;
    return user.abogadoId === causaAbogadoId;
  },
};
