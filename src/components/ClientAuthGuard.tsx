import { useEffect, useState } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { InactivityWarning } from "@/components/InactivityWarning";

// Rutas que solo puede ver el rol Socio
const SOCIO_ONLY = ["/equipo", "/configuracion"];

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const [isMounted, setIsMounted] = useState(false);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setHasAuth(auth.isAuthenticated());
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const authenticated = auth.isAuthenticated();
    setHasAuth(authenticated);

    if (!authenticated && pathname !== "/login") {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (authenticated && pathname === "/login") {
      navigate({ to: "/", replace: true });
      return;
    }

    // RBAC: bloquear rutas Socio-only para Asociados
    if (authenticated) {
      const user = auth.getUser();
      const isSocioOnly = SOCIO_ONLY.some((p) => pathname.startsWith(p));
      if (isSocioOnly && user?.role !== "Socio") {
        navigate({ to: "/", replace: true });
      }
    }
  }, [isMounted, pathname, navigate]);

  if (!isMounted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center flex-col gap-4"
        style={{ background: "var(--color-background)" }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "oklch(0.62 0.22 282 / 0.12)", border: "1px solid oklch(0.62 0.22 282 / 0.25)" }}>
          <Scale className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-muted-foreground)" }}>
          Cargando LexPanel...
        </p>
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!hasAuth) return null;

  return (
    <AppShell>
      <InactivityWarning />
      {children}
    </AppShell>
  );
}
