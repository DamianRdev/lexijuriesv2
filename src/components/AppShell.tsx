import { useState } from "react";
import { Menu, X, LayoutDashboard, FolderOpen, Calendar, ListTodo, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarContext } from "./SidebarContext";

/* ── Bottom nav items for mobile ── */
const mobileNav = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/causas", label: "Causas", icon: FolderOpen },
  { to: "/vencimientos", label: "Plazos", icon: Calendar },
  { to: "/tareas", label: "Tareas", icon: ListTodo },
  { to: "/equipo", label: "Más", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="flex min-h-screen w-full bg-background">

        {/* ── Desktop sidebar ──────────────────────────── */}
        <div
          className="hidden md:flex sticky top-0 h-screen flex-col flex-shrink-0 transition-all duration-200 relative"
          style={{ width: collapsed ? "60px" : "240px" }}
        >
          <AppSidebar
            collapsed={collapsed}
          />
          {/* Collapse toggle — positioned at the right edge of the sidebar */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex absolute top-[72px] -right-3 z-20 h-6 w-6 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronLeft className="h-3 w-3" />
            }
          </button>
        </div>


        {/* ── Mobile drawer overlay ─────────────────────── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 overlay-fade"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[240px] sidebar-slide-in">
              <AppSidebar
                collapsed={false}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ── Main content area ────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile topbar */}
          <header className="md:hidden flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <span className="text-xs font-bold">LP</span>
              </div>
              <span className="font-serif text-lg text-foreground">LexPanel</span>
            </div>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="rounded-lg p-2 hover:bg-muted transition-colors text-foreground touch-target flex items-center justify-center"
              aria-label="Menú"
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 min-w-0 overflow-auto pb-bottom-nav md:pb-0">
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>

        {/* ── Mobile bottom navigation ─────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border flex items-stretch"
             style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {mobileNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors touch-target ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </SidebarContext.Provider>
  );
}
