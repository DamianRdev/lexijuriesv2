// Time-based OTP simulation — 6-digit codes with 30-second windows.
// In production this would use RFC 6238 TOTP with a real HMAC-SHA1.

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}

function windowFor(ts = Date.now()): number {
  return Math.floor(ts / 30_000);
}

function codeFor(email: string, window: number): string {
  return String(djb2(email + ":" + window) % 1_000_000).padStart(6, "0");
}

export const totp = {
  generate(email: string): string {
    return codeFor(email, windowFor());
  },

  verify(email: string, input: string): boolean {
    const clean = input.replace(/\D/g, "").slice(0, 6);
    const w = windowFor();
    // Accept current window and previous (30 s grace period)
    return clean === codeFor(email, w) || clean === codeFor(email, w - 1);
  },

  secondsRemaining(): number {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
  },
};
