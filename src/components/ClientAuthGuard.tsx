import { useEffect, useState } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

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
    } else if (authenticated && pathname === "/login") {
      navigate({ to: "/", replace: true });
    }
  }, [isMounted, pathname, navigate]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primary border-primary/20" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold font-mono">
            Cargando LexPanel...
          </p>
        </div>
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!hasAuth) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
