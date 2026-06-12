import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Scale, Mail, Lock, ShieldAlert, ArrowRight,
  ShieldCheck, Smartphone, ArrowLeft, RefreshCw, AlertTriangle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { totp } from "@/lib/totp";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { isUsingLocalDb } from "@/lib/db";
import { signInWithSupabase } from "@/lib/supabaseAuth";
import { session } from "@/lib/session";
import { audit } from "@/lib/audit";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Acceso — LexPanel" }] }),
});

type Step = "credentials" | "2fa" | "locked";

function LoginPage() {
  const navigate = useNavigate();

  // --- Step 1 state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [credError, setCredError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLoadingCred, setIsLoadingCred] = useState(false);

  // --- Lockout state ---
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // --- Step 2 state ---
  const [step, setStep] = useState<Step>("credentials");
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(totp.secondsRemaining());
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== "2fa") return;
    const id = setInterval(() => setCountdown(totp.secondsRemaining()), 1000);
    return () => clearInterval(id);
  }, [step]);

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const rem = Math.ceil(rateLimit.msRemaining(lockedUntil) / 1000);
      setLockCountdown(rem);
      if (rem <= 0) {
        setLockedUntil(null);
        setStep("credentials");
        setCredError("");
        setAttemptsLeft(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // --- Step 1: credentials ---
  const handleCredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    setIsLoadingCred(true);

    const cleanEmail = sanitizeText(email).toLowerCase();

    // ── Production path: real Supabase Auth (no simulated 2FA) ──
    if (!isUsingLocalDb()) {
      const rate = rateLimit.check(cleanEmail);
      if (!rate.allowed && rate.lockedUntil) {
        setIsLoadingCred(false);
        setLockedUntil(rate.lockedUntil);
        setStep("locked");
        return;
      }
      signInWithSupabase(cleanEmail, password)
        .then((res) => {
          setIsLoadingCred(false);
          if (!res.ok) {
            const fail = rateLimit.fail(cleanEmail);
            if (fail.locked && fail.lockedUntil) {
              setLockedUntil(fail.lockedUntil);
              setStep("locked");
            } else {
              setAttemptsLeft(fail.attemptsLeft);
              setCredError(res.error);
            }
            return;
          }
          rateLimit.reset(cleanEmail);
          session.set(res.user, rememberMe);
          audit.log("2fa_success", res.user.email, res.user.role, "supabase_auth");
          toast.success(`Bienvenido/a, ${res.user.nombre}.`);
          navigate({ to: "/" });
        })
        .catch(() => {
          setIsLoadingCred(false);
          setCredError("Error de conexión. Intentá de nuevo.");
        });
      return;
    }

    // ── Demo path: mock auth with simulated 2FA ──
    setTimeout(() => {
      const result = auth.loginStep1(cleanEmail, password);
      setIsLoadingCred(false);

      if (result.status === "rate_limited") {
        setLockedUntil(result.lockedUntil);
        setStep("locked");
        return;
      }
      if (result.status === "invalid") {
        setAttemptsLeft(result.attemptsLeft);
        if (result.attemptsLeft === 0) {
          // Just got locked — re-check to get lockedUntil
          const rate = rateLimit.check(cleanEmail);
          if (!rate.allowed && rate.lockedUntil) {
            setLockedUntil(rate.lockedUntil);
            setStep("locked");
          }
        } else {
          setCredError("Credenciales incorrectas. Verificá el correo y la contraseña.");
        }
        return;
      }
      // success — go to 2FA
      setAttemptsLeft(null);
      setTempToken(result.tempToken);
      setStep("2fa");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      const code = totp.generate(cleanEmail);
      toast.info(`Código de verificación: ${code}`, {
        description: "Simulando envío al dispositivo registrado",
        duration: 30_000,
      });
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 700);
  };

  // --- Step 2: OTP ---
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && digit) {
      verifyOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length < 6) return;
    const digits = text.split("");
    setOtp(digits);
    verifyOtp(text);
  };

  const verifyOtp = (code: string) => {
    setIsLoadingOtp(true);
    setTimeout(() => {
      const user = auth.loginStep2(tempToken, code, rememberMe);
      setIsLoadingOtp(false);
      if (!user) {
        setOtpError("Código incorrecto o expirado. Intentá de nuevo.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }
      toast.success(`Bienvenido/a, ${user.nombre}.`);
      navigate({ to: "/" });
    }, 600);
  };

  const regenerateCode = () => {
    const code = totp.generate(sanitizeText(email).toLowerCase());
    toast.info(`Nuevo código: ${code}`, {
      description: "El código anterior sigue válido por 30 s",
      duration: 30_000,
    });
    setCountdown(totp.secondsRemaining());
  };


  // Shared bg/card styles
  const inputStyle: React.CSSProperties = {
    background: "var(--color-background)",
    border: "1px solid var(--color-border)",
    color: "var(--color-foreground)",
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4"
      style={{ background: "var(--color-background)" }}
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.22 282 / 0.35) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.22 305 / 0.4) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.92 0.016 285) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.92 0.016 285) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] rounded-xl p-8 shadow-2xl"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 80px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.62 0.22 282 / 0.08)",
        }}
      >
        <div className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 282 / 0.6), transparent)" }} />

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: "oklch(0.62 0.22 282 / 0.12)",
              border: "1px solid oklch(0.62 0.22 282 / 0.25)",
              boxShadow: "0 0 20px oklch(0.62 0.22 282 / 0.15)",
            }}>
            <Scale className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            LexPanel
          </h1>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--color-muted-foreground)" }}>
            {step === "credentials" ? "Portal de Acceso Profesional" : "Verificación en dos pasos"}
          </p>
        </div>

        {/* ── STEP 1: Credentials ─────────────────────────────────── */}
        {step === "credentials" && (
          <>
            {credError && (
              <div className="mb-5 flex items-start gap-3 rounded-lg p-3.5"
                style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.61 0.24 22 / 0.3)" }}>
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "oklch(0.72 0.20 22)" }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.85 0.08 22)" }}>{credError}</p>
              </div>
            )}

            <form onSubmit={handleCredSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--color-muted-foreground)" }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="abogado@estudio.com"
                    className="w-full rounded-lg pl-10 pr-4 py-2.5 text-[13px] transition-all focus:outline-none"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.62 0.22 282 / 0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--color-muted-foreground)" }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg pl-10 pr-4 py-2.5 text-[13px] transition-all focus:outline-none"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.62 0.22 282 / 0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Attempts warning */}
          {attemptsLeft !== null && attemptsLeft <= 3 && attemptsLeft > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
              style={{ background: "oklch(0.18 0.07 65)", border: "1px solid oklch(0.76 0.17 65 / 0.3)" }}>
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "oklch(0.76 0.17 65)" }} />
              <p className="text-[11px]" style={{ color: "oklch(0.88 0.10 65)" }}>
                {attemptsLeft === 1
                  ? "Último intento. La cuenta se bloqueará por 5 minutos."
                  : `Te quedan ${attemptsLeft} intentos antes del bloqueo.`}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
                <button
                  type="button" onClick={() => setRememberMe(!rememberMe)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded cursor-pointer transition-all"
                  style={rememberMe
                    ? { background: "var(--color-primary)", border: "1px solid var(--color-primary)" }
                    : { background: "transparent", border: "1px solid var(--color-border)" }
                  }>
                  {rememberMe && <span className="text-[9px] font-bold text-white leading-none">✓</span>}
                </button>
                <span className="text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                  Recordarme por 7 días
                </span>
              </div>

              <button
                type="submit" disabled={isLoadingCred}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)", boxShadow: "0 0 20px oklch(0.62 0.22 282 / 0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 28px oklch(0.62 0.22 282 / 0.45)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px oklch(0.62 0.22 282 / 0.3)")}
              >
                {isLoadingCred
                  ? <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  : <><span>Continuar</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                }
              </button>
            </form>

          </>
        )}

        {/* ── STEP LOCKED: Rate limit ─────────────────────────────── */}
        {step === "locked" && (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full pulse-critical"
                style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.72 0.20 22 / 0.4)" }}>
                <ShieldAlert className="h-7 w-7" style={{ color: "oklch(0.72 0.20 22)" }} />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
                Cuenta temporalmente bloqueada
              </h2>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                Demasiados intentos fallidos. Podés volver a intentar en:
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-xl px-6 py-4"
              style={{ background: "oklch(0.17 0.08 22 / 0.6)", border: "1px solid oklch(0.72 0.20 22 / 0.25)" }}>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold tabular-nums"
                  style={{ color: lockCountdown <= 60 ? "oklch(0.72 0.20 22)" : "var(--color-foreground)" }}>
                  {String(Math.floor(lockCountdown / 60)).padStart(2, "0")}:{String(lockCountdown % 60).padStart(2, "0")}
                </div>
                <div className="text-[10px] mt-1 font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-muted-foreground)" }}>minutos restantes</div>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
              Si creés que esto es un error, contactá al administrador del sistema.
            </p>
          </div>
        )}

        {/* ── STEP 2: 2FA OTP ─────────────────────────────────────── */}
        {step === "2fa" && (
          <>
            {/* Info banner */}
            <div className="mb-6 flex items-start gap-3 rounded-lg p-3.5"
              style={{ background: "oklch(0.15 0.05 282 / 0.6)", border: "1px solid oklch(0.62 0.22 282 / 0.25)" }}>
              <Smartphone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-foreground)/80" }}>
                Ingresá el código de 6 dígitos enviado al dispositivo registrado.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg p-3.5"
                style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.61 0.24 22 / 0.3)" }}>
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "oklch(0.72 0.20 22)" }} />
                <p className="text-[12px]" style={{ color: "oklch(0.85 0.08 22)" }}>{otpError}</p>
              </div>
            )}

            {/* OTP inputs */}
            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isLoadingOtp}
                  className="h-12 w-10 rounded-lg text-center text-lg font-mono font-bold transition-all focus:outline-none disabled:opacity-40"
                  style={{
                    background: digit ? "oklch(0.62 0.22 282 / 0.12)" : "var(--color-background)",
                    border: `1px solid ${digit ? "oklch(0.62 0.22 282 / 0.5)" : "var(--color-border)"}`,
                    color: "var(--color-foreground)",
                    boxShadow: digit ? "0 0 8px oklch(0.62 0.22 282 / 0.15)" : "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.62 0.22 282 / 0.15)"; }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? "oklch(0.62 0.22 282 / 0.5)" : "var(--color-border)";
                    e.target.style.boxShadow = digit ? "0 0 8px oklch(0.62 0.22 282 / 0.15)" : "none";
                  }}
                />
              ))}
            </div>

            {/* Countdown + resend */}
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                Código válido por{" "}
                <span className="font-mono font-semibold" style={{ color: countdown <= 10 ? "oklch(0.72 0.20 22)" : "var(--color-foreground)" }}>
                  {countdown}s
                </span>
              </span>
              <button
                type="button" onClick={regenerateCode}
                className="flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                style={{ color: "var(--color-primary)" }}
              >
                <RefreshCw className="h-3 w-3" />
                Reenviar código
              </button>
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={() => verifyOtp(otp.join(""))}
              disabled={isLoadingOtp || otp.some((d) => !d)}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)", boxShadow: "0 0 20px oklch(0.62 0.22 282 / 0.3)" }}
            >
              {isLoadingOtp
                ? <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                : <><ShieldCheck className="h-4 w-4" /><span>Verificar</span></>
              }
            </button>

            {/* Back */}
            <button
              type="button"
              onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors cursor-pointer"
              style={{ color: "var(--color-muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
