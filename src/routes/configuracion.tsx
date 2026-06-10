import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Bell,
  Mail,
  Smartphone,
  LayoutList,
  Rows3,
  Eye,
  Shield,
  Check,
  ChevronRight,
  Database,
  ScrollText,
  LogIn,
  LogOut,
  Clock,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { ToggleRow } from "@/components/ToggleRow";
import { isUsingLocalDb, setUsingLocalDb } from "@/lib/db";
import { audit, type AuditEntry } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracion")({
  component: ConfiguracionPage,
  head: () => ({ meta: [{ title: "Configuración — LexPanel" }] }),
});

type ThemeMode = "light" | "dark" | "system";
type TableDensity = "compact" | "normal";

function ConfiguracionPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [tableDensity, setTableDensity] = useState<TableDensity>("normal");

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [vencimientoAlert, setVencimientoAlert] = useState(true);
  const [movimientoAlert, setMovimientoAlert] = useState(false);
  const [resumenSemanal, setResumenSemanal] = useState(true);

  const [showArchived, setShowArchived] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [localDb, setLocalDb] = useState(isUsingLocalDb());
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => audit.getAll());
  const isSocio = auth.getUser()?.role === "Socio";

  const handleDbToggle = (checked: boolean) => {
    setUsingLocalDb(checked);
    setLocalDb(checked);
    toast.success(
      checked
        ? "Base de datos local (Mock) activada. Cargando datos de prueba..."
        : "Conectando a Supabase. Cargando datos de la nube...",
      { description: "La página se recargará para aplicar los cambios." }
    );
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleResetLocalDb = () => {
    const keys = ["lexpanel_causas", "lexpanel_clientes", "lexpanel_vencimientos", "lexpanel_tareas", "lexpanel_abogados"];
    keys.forEach((k) => localStorage.removeItem(k));
    toast.success("Datos de demo reiniciados.", {
      description: "El sistema se recargará con los datos originales de demostración."
    });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <h1 className="font-serif text-4xl text-foreground tracking-tight mb-1">Configuración</h1>
      <p className="text-sm text-muted-foreground mb-8">Preferencias generales del estudio</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apariencia */}
          <Card title="Apariencia" icon={<Monitor className="h-4 w-4" />}>
            <div className="space-y-5">
              {/* Tema */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  Tema de la interfaz
                </label>
                <div className="flex gap-2">
                  <ThemeButton
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                    icon={<Sun className="h-4 w-4" />}
                    label="Claro"
                  />
                  <ThemeButton
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                    icon={<Moon className="h-4 w-4" />}
                    label="Oscuro"
                  />
                  <ThemeButton
                    active={theme === "system"}
                    onClick={() => setTheme("system")}
                    icon={<Monitor className="h-4 w-4" />}
                    label="Sistema"
                  />
                </div>
              </div>

              {/* Densidad tablas */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  Densidad de tablas
                </label>
                <div className="flex gap-2">
                  <ThemeButton
                    active={tableDensity === "normal"}
                    onClick={() => setTableDensity("normal")}
                    icon={<LayoutList className="h-4 w-4" />}
                    label="Normal"
                  />
                  <ThemeButton
                    active={tableDensity === "compact"}
                    onClick={() => setTableDensity("compact")}
                    icon={<Rows3 className="h-4 w-4" />}
                    label="Compacta"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Notificaciones */}
          <Card title="Notificaciones" icon={<Bell className="h-4 w-4" />}>
            <div className="space-y-3">
              <ToggleRow
                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                label="Notificaciones por email"
                description="Recibir alertas en la casilla de correo"
                checked={emailNotif}
                onChange={setEmailNotif}
              />
              <ToggleRow
                icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
                label="Notificaciones push"
                description="Alertas en el navegador en tiempo real"
                checked={pushNotif}
                onChange={setPushNotif}
              />
              <div className="border-t border-border my-3" />
              <ToggleRow
                icon={<Shield className="h-4 w-4 text-destructive" />}
                label="Alertas de vencimientos críticos"
                description="Notificar 48 hs antes de fechas límite"
                checked={vencimientoAlert}
                onChange={setVencimientoAlert}
              />
              <ToggleRow
                icon={<Eye className="h-4 w-4 text-primary" />}
                label="Nuevos movimientos en causas"
                description="Avisar cuando haya actualizaciones judiciales"
                checked={movimientoAlert}
                onChange={setMovimientoAlert}
              />
              <ToggleRow
                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                label="Resumen semanal"
                description="Reporte de actividad todos los lunes"
                checked={resumenSemanal}
                onChange={setResumenSemanal}
              />
            </div>
          </Card>

          {/* Audit Log — solo Socio */}
          {isSocio && (
            <Card title="Registro de Actividad" icon={<ScrollText className="h-4 w-4" />}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Últimas {auditLog.length} acciones en el sistema</p>
                <button
                  onClick={() => { audit.clear(); setAuditLog([]); toast.success("Registro limpiado."); }}
                  className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Limpiar
                </button>
              </div>
              {auditLog.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sin actividad registrada.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {auditLog.slice(0, 50).map((entry) => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Preferencias de visualización */}
          <Card title="Visualización" icon={<Eye className="h-4 w-4" />}>
            <div className="space-y-3">
              <ToggleRow
                label="Mostrar causas archivadas"
                description="Incluir expedientes finalizados en listados"
                checked={showArchived}
                onChange={setShowArchived}
              />
              <ToggleRow
                label="Actualización automática"
                description="Refrescar datos cada 5 minutos"
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />
            </div>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Origen de Datos */}
          <Card title="Origen de Datos" icon={<Database className="h-4 w-4" />}>
            <div className="space-y-3">
              <ToggleRow
                label="Base de Datos Local (Mock)"
                description="Usar base de datos local simulada con datos de demostración ricos y completos. Desactivar para conectarse a Supabase."
                checked={localDb}
                onChange={handleDbToggle}
              />
              <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Estado:</span>
                <span className={`font-semibold ${localDb ? "text-primary" : "text-success"}`}>
                  {localDb ? "Local (Simulada)" : "Supabase Activo"}
                </span>
              </div>
              {localDb && (
                <button
                  onClick={handleResetLocalDb}
                  className="w-full mt-1 text-xs font-medium text-destructive hover:text-destructive/80 flex items-center justify-center gap-1 py-2 rounded-md border border-destructive/20 hover:bg-destructive/5 transition-colors"
                >
                  Reiniciar datos de demo
                </button>
              )}
            </div>
          </Card>

          {/* Datos del estudio */}
          <Card title="Datos del estudio" icon={<SettingsIcon className="h-4 w-4" />}>
            <dl className="space-y-3 text-sm">
              <DataRow label="Razón social" value="Méndez, Herrera & Álvarez Abogados" />
              <DataRow label="CUIT" value="30-71234567-8" />
              <DataRow label="Domicilio" value="Av. Corrientes 1234, Piso 8°, CABA" />
              <DataRow label="Matrícula" value="CPACF T° 123 F° 456" />
            </dl>
            <button className="mt-4 w-full text-xs font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-2 rounded-md border border-primary/20 hover:bg-primary/5 transition-colors">
              Editar datos del estudio
              <ChevronRight className="h-3 w-3" />
            </button>
          </Card>

          {/* Integraciones */}
          <Card title="Integraciones">
            <div className="space-y-2.5">
              <IntegrationRow name="Portal PJN" status="connected" />
              <IntegrationRow name="MEV SCBA" status="connected" />
              <IntegrationRow name="AFIP" status="disconnected" />
              <IntegrationRow name="Google Calendar" status="connected" />
            </div>
          </Card>

          {/* Plan */}
          <Card title="Suscripción">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">Estudio Profesional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuarios</span>
                <span className="font-medium text-foreground">3 / 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Próximo cobro</span>
                <span className="font-medium text-foreground">01/06/2026</span>
              </div>
              <div className="pt-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  60% del cupo de usuarios utilizado
                </p>
              </div>
            </div>
          </Card>

          {/* Seguridad */}
          <Card title="Seguridad">
            <dl className="space-y-3 text-sm">
              <DataRow label="Autenticación en 2 pasos" value="Activada" valueColor="success" />
              <DataRow label="Última sesión" value="26/05/2026 09:14" />
            </dl>
          </Card>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
        <SettingsIcon className="h-3.5 w-3.5" />
        LexPanel v1.0 · Última sincronización 26/05/2026 14:32
      </div>
    </div>
  );
}

/* ─── Subcomponentes ─── */

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent"
      }`}
    >
      {icon}
      {label}
      {active && <Check className="h-3 w-3 ml-0.5" />}
    </button>
  );
}

// ToggleRow has been moved to src/components/ToggleRow.tsx

function DataRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-foreground text-right text-xs font-medium ${
          valueColor === "success" ? "text-success" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function IntegrationRow({ name, status }: { name: string; status: "connected" | "disconnected" }) {
  const isConnected = status === "connected";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{name}</span>
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
          isConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isConnected ? "bg-success" : "bg-muted-foreground/50"
          }`}
        />
        {isConnected ? "Conectado" : "No conectado"}
      </span>
    </div>
  );
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login:             { label: "Inicio de sesión",   icon: <LogIn className="h-3 w-3" />,  color: "oklch(0.70 0.17 165)" },
  logout:            { label: "Cierre de sesión",   icon: <LogOut className="h-3 w-3" />, color: "oklch(0.55 0.022 278)" },
  session_expired:   { label: "Sesión expirada",    icon: <Clock className="h-3 w-3" />,  color: "oklch(0.72 0.20 22)" },
  session_refreshed: { label: "Sesión extendida",   icon: <Clock className="h-3 w-3" />,  color: "oklch(0.76 0.17 65)" },
  rbac_denied:       { label: "Acceso denegado",    icon: <Shield className="h-3 w-3" />, color: "oklch(0.72 0.20 22)" },
  "2fa_required":    { label: "2FA solicitado",     icon: <Smartphone className="h-3 w-3" />, color: "oklch(0.65 0.18 240)" },
  "2fa_success":     { label: "2FA verificado",     icon: <ShieldCheck className="h-3 w-3" />, color: "oklch(0.70 0.17 165)" },
  "2fa_failed":      { label: "2FA fallido",        icon: <ShieldAlert className="h-3 w-3" />, color: "oklch(0.72 0.20 22)" },
};

function AuditRow({ entry }: { entry: AuditEntry }) {
  const meta = ACTION_LABELS[entry.action] ?? {
    label: entry.action.replace(/_/g, " "),
    icon: <ScrollText className="h-3 w-3" />,
    color: "oklch(0.55 0.022 278)",
  };
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-[11px]"
      style={{ borderBottom: "1px solid oklch(0.195 0.022 275 / 0.5)" }}>
      <span className="shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
      <span className="flex-1 text-foreground/80 truncate">{meta.label}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{entry.user.split("@")[0]}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{audit.formatTs(entry.ts)}</span>
    </div>
  );
}
