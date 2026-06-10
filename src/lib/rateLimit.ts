// Login rate limiting — 5 attempts per email, 5-minute lockout on breach.
// Stored in localStorage so it survives page reloads.

const KEY = "lexpanel_rate";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

interface AttemptRecord {
  count: number;
  lockedUntil?: number;
}

type RateStore = Record<string, AttemptRecord>;

function load(): RateStore {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

function save(s: RateStore) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const rateLimit = {
  check(email: string): { allowed: boolean; attemptsLeft: number; lockedUntil?: number } {
    const rec = load()[email];
    if (!rec) return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
    if (rec.lockedUntil) {
      if (rec.lockedUntil > Date.now()) {
        return { allowed: false, attemptsLeft: 0, lockedUntil: rec.lockedUntil };
      }
      // Lockout expired — clear record
      const store = load();
      delete store[email];
      save(store);
      return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
    }
    const left = MAX_ATTEMPTS - rec.count;
    return { allowed: left > 0, attemptsLeft: Math.max(0, left) };
  },

  fail(email: string): { attemptsLeft: number; locked: boolean; lockedUntil?: number } {
    const store = load();
    const rec: AttemptRecord = store[email] ?? { count: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    store[email] = rec;
    save(store);
    return {
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - rec.count),
      locked: rec.count >= MAX_ATTEMPTS,
      lockedUntil: rec.lockedUntil,
    };
  },

  reset(email: string): void {
    const store = load();
    delete store[email];
    save(store);
  },

  msRemaining(lockedUntil: number): number {
    return Math.max(0, lockedUntil - Date.now());
  },
};
