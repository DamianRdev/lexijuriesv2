import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  Settings,
  LogOut,
  Scale,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/causas", label: "Causas", icon: FolderOpen },
  { to: "/vencimientos", label: "Vencimientos", icon: Calendar },
  { to: "/equipo", label: "Equipo", icon: Users },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

interface Props {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Scale className="h-5 w-5" />
        </div>
        <span className="font-serif text-2xl text-white tracking-tight">LexPanel</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-white border-l-2 border-primary -ml-[2px] pl-[14px]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-white">
            LM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Dra. Laura Méndez</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">Socia</p>
          </div>
          <button className="text-sidebar-foreground/70 hover:text-white" aria-label="Salir">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
