// Simulated JWT — structure-compatible with real JWTs but signature uses a simple hash.
// In production this would be replaced with a real backend-signed RS256 token.

const SECRET = "lexpanel_dev_2026_secret";

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h >>> 0).toString(36);
}

function b64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecode(str: string): string {
  const pad = str.length % 4;
  const padded = pad ? str + "=".repeat(4 - pad) : str;
  return decodeURIComponent(escape(atob(padded.replace(/-/g, "+").replace(/_/g, "/"))));
}

export interface TokenClaims {
  sub: string;
  name: string;
  role: "Socio" | "Asociado";
  iniciales: string;
  abogadoId: string;
  iat: number;
  exp: number;
}

const HEADER = b64url(JSON.stringify({ alg: "HS256sim", typ: "JWT" }));

export const jwtSim = {
  generate(
    claims: Omit<TokenClaims, "iat" | "exp">,
    ttlMs = 30 * 60 * 1000,
  ): string {
    const now = Date.now();
    const payload: TokenClaims = { ...claims, iat: now, exp: now + ttlMs };
    const body = b64url(JSON.stringify(payload));
    const sig = simpleHash(HEADER + "." + body + SECRET);
    return `${HEADER}.${body}.${sig}`;
  },

  verify(t: string): TokenClaims | null {
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return null;
      const [header, body, sig] = parts;
      if (simpleHash(header + "." + body + SECRET) !== sig) return null;
      const claims = JSON.parse(b64urlDecode(body)) as TokenClaims;
      if (claims.exp < Date.now()) return null;
      return claims;
    } catch {
      return null;
    }
  },

  decode(t: string): TokenClaims | null {
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(b64urlDecode(parts[1])) as TokenClaims;
    } catch {
      return null;
    }
  },
};
