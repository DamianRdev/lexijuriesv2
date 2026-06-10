import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  Settings,
  LogOut,
  Scale,
  Contact,
  ListTodo,
  Database,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { isUsingLocalDb } from "@/lib/db";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/causas", label: "Causas", icon: FolderOpen },
  { to: "/vencimientos", label: "Vencimientos", icon: Calendar },
  { to: "/clientes", label: "Clientes", icon: Contact },
  { to: "/tareas", label: "Tareas", icon: ListTodo },
];

const navSecondary = [
  { to: "/equipo", label: "Equipo", icon: Users },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

interface Props {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, onNavigate }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = auth.getUser() || { nombre: "Dra. Laura Méndez", role: "Socio", iniciales: "LM" };
  const localDb = isUsingLocalDb();

  const handleLogoutClick = () => {
    auth.logout();
    toast.success("Sesión cerrada con éxito.");
    navigate({ to: "/login", replace: true });
  };

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={`
          group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium
          transition-all duration-150 select-none
          ${collapsed ? "justify-center px-2" : ""}
          ${active
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }
        `}
      >
        {/* Active left bar */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-primary" />
        )}

        <Icon className={`shrink-0 transition-colors ${collapsed ? "h-[18px] w-[18px]" : "h-4 w-4"} ${active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"}`} />

        {!collapsed && <span className="truncate leading-none">{item.label}</span>}

        {/* Tooltip in collapsed mode */}
        {collapsed && (
          <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1.5 text-xs font-medium text-sidebar-accent-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {item.label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-sidebar-accent" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="flex h-full flex-col overflow-hidden relative"
      style={{
        width: "100%",
        background: "var(--color-sidebar)",
        borderRight: "1px solid var(--color-sidebar-border)",
      }}
    >
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* ── Logo ─────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center px-3" : ""}`}>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
          <Scale className="h-4 w-4 text-primary" />
          <div className="absolute inset-0 rounded-lg bg-primary/5 blur-sm" />
        </div>
        {!collapsed && (
          <span className="font-serif text-[18px] font-semibold tracking-tight text-sidebar-accent-foreground whitespace-nowrap">
            LexPanel
          </span>
        )}
      </div>

      {/* ── Nav items ────────────────────────── */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto sidebar-scroll">
        {!collapsed && (
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40">
            Principal
          </p>
        )}
        {navItems.map((item) => <NavItem key={item.to} item={item} />)}

        <div className={`my-3 border-t border-sidebar-border ${collapsed ? "mx-2" : "mx-1"}`} />

        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40">
            Gestión
          </p>
        )}
        {navSecondary.map((item) => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* ── DB Mode badge ────────────────────── */}
      {!collapsed && (
        <Link
          to="/configuracion"
          className="mx-3 mb-2 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors hover:bg-sidebar-accent/50"
          style={{ color: localDb ? "oklch(0.58 0.14 175)" : "oklch(0.62 0.15 155)" }}
        >
          <Database className="h-3 w-3 shrink-0" />
          <span className="truncate">{localDb ? "Modo Local" : "Supabase"}</span>
        </Link>
      )}

      {/* ── User footer ──────────────────────── */}
      <div className={`border-t border-sidebar-border px-3 py-3 ${collapsed ? "px-2" : ""}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary ring-1 ring-primary/25 uppercase">
              {user.iniciales}
            </div>
            <button
              onClick={handleLogoutClick}
              className="text-sidebar-foreground/50 hover:text-destructive transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[12px] font-bold text-primary ring-1 ring-primary/25 uppercase">
              {user.iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-sidebar-accent-foreground truncate leading-tight">
                {user.nombre}
              </p>
              <p className="text-[11px] text-sidebar-foreground/55 truncate leading-tight mt-0.5">
                {user.role === "Socio" ? "Socia · Partner" : "Asociado/a"}
              </p>
            </div>
            <button
              onClick={handleLogoutClick}
              className="rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-destructive cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
