import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { session } from "@/lib/session";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";

const WARN_BEFORE_MS = 5 * 60 * 1000;  // mostrar aviso 5 min antes del vencimiento
const CHECK_INTERVAL = 30_000;          // revisar cada 30 s

export function InactivityWarning() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doLogout = useCallback(() => {
    const user = auth.getUser();
    if (user) audit.log("session_expired", user.email, user.role);
    auth.logout();
    navigate({ to: "/login", replace: true });
  }, [navigate]);

  const extendSession = useCallback(() => {
    session.refresh();
    const user = auth.getUser();
    if (user) audit.log("session_refreshed", user.email, user.role);
    setShowWarning(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // Actividad del usuario: reset timer al interactuar
  useEffect(() => {
    const onActivity = () => {
      if (!showWarning) session.refresh();
    };
    const events: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, onActivity));
  }, [showWarning]);

  // Verificación periódica del tiempo restante
  useEffect(() => {
    const check = () => {
      if (!session.isValid()) {
        doLogout();
        return;
      }
      const remaining = session.getRemainingMs();
      if (remaining <= WARN_BEFORE_MS && remaining > 0) {
        setShowWarning(true);
        setRemainingSec(Math.floor(remaining / 1000));
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [doLogout]);

  // Countdown cuando el modal está visible
  useEffect(() => {
    if (!showWarning) return;
    countdownRef.current = setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          doLogout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, doLogout]);

  if (!showWarning) return null;

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const urgente = remainingSec < 60;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overlay-fade"
      style={{ background: "oklch(0 0 0 / 0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-2xl relative overflow-hidden"
        style={{
          background: "var(--color-card)",
          border: "1px solid oklch(0.72 0.20 22 / 0.4)",
          boxShadow: "0 24px 80px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.72 0.20 22 / 0.1)",
        }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.20 22 / 0.8), transparent)" }} />

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full pulse-critical"
            style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.72 0.20 22 / 0.3)" }}>
            <ShieldAlert className="h-6 w-6" style={{ color: "oklch(0.72 0.20 22)" }} />
          </div>
        </div>

        <h2 className="text-center font-serif text-xl font-semibold text-foreground mb-1">
          Sesión por vencer
        </h2>
        <p className="text-center text-xs text-muted-foreground mb-5">
          Tu sesión expirará por inactividad. ¿Querés continuar?
        </p>

        {/* Countdown */}
        <div
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 mb-5"
          style={{ background: "oklch(0.17 0.08 22 / 0.5)", border: "1px solid oklch(0.72 0.20 22 / 0.2)" }}
        >
          <Clock className="h-4 w-4 shrink-0" style={{ color: "oklch(0.72 0.20 22)" }} />
          <span className="font-mono font-bold text-lg" style={{ color: urgente ? "oklch(0.72 0.20 22)" : "var(--color-foreground)" }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">restantes</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={doLogout}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Cerrar sesión
          </button>
          <button
            onClick={extendSession}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all cursor-pointer"
            style={{ background: "var(--color-primary)", boxShadow: "0 0 20px oklch(0.62 0.22 282 / 0.3)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
