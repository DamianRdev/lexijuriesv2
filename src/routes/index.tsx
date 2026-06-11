import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FolderOpen,
  CalendarClock,
  Activity,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  Calendar,
  FileText,
  User,
  Scale,
  TrendingUp,
} from "lucide-react";
import { getAbogado, formatFechaLarga, abogados } from "@/lib/mockData";
import { useCausas, useVencimientos } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — LexPanel" }] }),
});

const materiaColors: Record<string, string> = {
  Civil: "badge-civil",
  Laboral: "badge-laboral",
  Familia: "badge-familia",
  Comercial: "badge-comercial",
};

function Dashboard() {
  const { data: causasData = [], isLoading: isLoadingCausas } = useCausas();
  const { data: vencimientosData = [], isLoading: isLoadingVencs } = useVencimientos();
  const isLoading = isLoadingCausas || isLoadingVencs;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const activasCount = causasData.filter((c) => c.estado === "Activo").length;
  const vencimientosActivos = vencimientosData.filter(
    (v) => v.estado !== "Cumplido" && v.fecha >= todayStr,
  );
  const criticos = vencimientosActivos.filter((v) => v.estado === "Crítico");
  const criticosCount = criticos.length;
  const semanaStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const semanaVencimientosCount = vencimientosActivos.filter((v) => v.fecha <= semanaStr).length;
  const conMovimientoHoyCount = causasData.filter((c) => c.ultimoMovimientoFecha === todayStr).length;

  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const KPIS = [
    { label: "Causas Activas", value: activasCount, icon: FolderOpen, hint: "+2 este mes", alert: false, accent: "oklch(0.62 0.22 282)" },
    { label: "Venc. Críticos", value: criticosCount, icon: AlertTriangle, hint: `${semanaVencimientosCount} esta semana`, alert: criticosCount > 0, accent: "oklch(0.61 0.24 22)" },
    { label: "Novedades Hoy", value: conMovimientoHoyCount, icon: Activity, hint: "Movimientos registrados", alert: false, accent: "oklch(0.70 0.17 165)" },
    {
      label: "Honorarios Pend.",
      value: isSocio ? "$4.820.000" : "—",
      icon: DollarSign,
      hint: isSocio ? "8 facturas activas" : "Solo Socios",
      alert: false,
      accent: "oklch(0.76 0.17 65)",
    },
  ];

  const vencimientosProximos = [...vencimientosActivos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 4);

  const causasRecientes = [...causasData]
    .sort((a, b) => b.ultimoMovimientoFecha.localeCompare(a.ultimoMovimientoFecha))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="px-6 py-7 md:px-8 lg:px-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex justify-between items-end pb-5 border-b border-border">
          <div className="space-y-2"><Skeleton className="h-3 w-32 shimmer" /><Skeleton className="h-8 w-56 shimmer" /></div>
          <Skeleton className="h-9 w-36 shimmer" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 lg:col-span-2 shimmer" />
          <Skeleton className="h-80 shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-border">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
            {formatFechaLarga(today)}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight leading-tight">
            Hola,{" "}
            <span className="gradient-text">
              {user?.nombre?.split(" ")[1] ?? user?.nombre ?? "Laura"}
            </span>
          </h1>
        </div>
      </div>

      {/* ── Critical alert ─────────────────── */}
      {criticosCount > 0 && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl p-4 animate-in fade-in duration-300"
          style={{
            background: "oklch(0.17 0.08 22)",
            border: "1px solid oklch(0.61 0.24 22 / 0.35)",
          }}
        >
          <div className="flex gap-3 min-w-0">
            <div className="pulse-critical mt-0.5 shrink-0">
              <AlertTriangle className="h-4 w-4" style={{ color: "oklch(0.72 0.20 22)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: "oklch(0.88 0.06 22)" }}>
                {criticosCount} vencimiento{criticosCount > 1 ? "s" : ""} procesal{criticosCount > 1 ? "es" : ""} inminente{criticosCount > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-[11px] font-mono truncate" style={{ color: "oklch(0.65 0.14 22)" }}>
                {criticos.map((v) => v.expediente).join(" · ")}
              </p>
            </div>
          </div>
          <Link
            to="/vencimientos"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
            style={{ background: "oklch(0.61 0.24 22)", color: "#fff" }}
          >
            Resolver <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── KPI Grid ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="card-hover relative overflow-hidden rounded-xl p-4 sm:p-5"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: k.alert ? "oklch(0.61 0.24 22)" : k.accent }}
              />
              {/* Icon */}
              <div
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: `${k.accent}18`,
                  color: k.accent,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                {k.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {typeof k.value === "number" ? k.value.toString() : k.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{k.hint}</p>
            </div>
          );
        })}
      </div>

      {/* ── Main content split ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Plazos inminentes */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl h-full"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h2 className="text-[14px] font-semibold text-foreground">Plazos Judiciales Inminentes</h2>
              </div>
              <Link
                to="/vencimientos"
                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                Ver calendario <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-4 sm:p-5 space-y-2.5">
              {vencimientosProximos.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-[13px] text-muted-foreground">
                  No hay vencimientos pendientes.
                </div>
              ) : (
                vencimientosProximos.map((v) => {
                  const ab = getAbogado(v.abogadoId);
                  const isCrit = v.estado === "Crítico";
                  const dateObj = new Date(v.fecha + "T00:00:00");
                  return (
                    <div
                      key={v.id}
                      className="group flex items-center gap-3 sm:gap-4 rounded-xl p-3 transition-all"
                      style={{
                        background: isCrit ? "oklch(0.17 0.08 22 / 0.5)" : "var(--color-background)",
                        border: `1px solid ${isCrit ? "oklch(0.61 0.24 22 / 0.25)" : "var(--color-border)"}`,
                      }}
                    >
                      {/* Date block */}
                      <div
                        className="shrink-0 w-12 rounded-lg py-2 text-center"
                        style={{
                          background: isCrit ? "oklch(0.61 0.24 22 / 0.15)" : "var(--color-accent)",
                        }}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isCrit ? "oklch(0.72 0.20 22)" : "var(--color-primary)" }}>
                          {dateObj.toLocaleDateString("es-AR", { month: "short" })}
                        </p>
                        <p className="text-xl font-bold leading-tight" style={{ color: isCrit ? "oklch(0.80 0.16 22)" : "var(--color-foreground)" }}>
                          {dateObj.getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                            Exp. {v.expediente}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isCrit ? "badge-critico" : "badge-proximo"}`}
                          >
                            {v.estado}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-foreground leading-snug truncate">{v.descripcion}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{ab?.nombre}</p>
                      </div>
                      <Link
                        to="/causas/$id"
                        params={{ id: v.causaId }}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--color-primary)";
                          e.currentTarget.style.borderColor = "var(--color-primary)";
                          e.currentTarget.style.background = "oklch(0.62 0.22 282 / 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--color-muted-foreground)";
                          e.currentTarget.style.borderColor = "var(--color-border)";
                          e.currentTarget.style.background = "transparent";
                        }}
                        title="Ver expediente"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div
            className="rounded-xl p-4 sm:p-5 space-y-3"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-foreground">Acciones Rápidas</h2>
            </div>
            <div className="space-y-1.5">
              {[
                { to: "/causas", icon: Plus, label: "Registrar Nueva Causa" },
                { to: "/vencimientos", icon: Calendar, label: "Ver Calendario de Plazos" },
                { to: "/tareas", icon: FileText, label: "Gestionar Tareas" },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition-all"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.62 0.22 282 / 0.4)";
                    e.currentTarget.style.background = "var(--color-accent)";
                    e.currentTarget.style.color = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background = "var(--color-background)";
                    e.currentTarget.style.color = "var(--color-foreground)";
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Workload */}
          <div
            className="rounded-xl p-4 sm:p-5 space-y-4"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-foreground">Distribución del Estudio</h2>
            </div>
            <div className="space-y-3">
              {abogados.map((ab) => {
                const count = causasData.filter((c) => c.abogadoId === ab.id && c.estado === "Activo").length;
                return <WorkloadBar key={ab.id} name={ab.nombre} cases={count} total={activasCount || 1} />;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent activity ────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-[14px] font-semibold text-foreground">Actividad Procesal Reciente</h2>
          <Link to="/causas" className="text-[12px] font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="text-left text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <th className="px-5 py-3 font-mono">Expediente</th>
                <th className="px-5 py-3">Carátula</th>
                <th className="px-5 py-3 hidden sm:table-cell">Materia</th>
                <th className="px-5 py-3 hidden lg:table-cell">Juzgado</th>
                <th className="px-5 py-3 hidden md:table-cell">Último Movimiento</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {causasRecientes.map((c) => (
                <tr
                  key={c.id}
                  className="table-row-hover"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                    {c.expediente}
                  </td>
                  <td className="px-5 py-3.5 max-w-[8rem] sm:max-w-xs truncate">
                    <Link
                      to="/causas/$id"
                      params={{ id: c.id }}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {c.caratula}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${materiaColors[c.materia] ?? "badge-otra"}`}>
                      {c.materia}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-muted-foreground hidden lg:table-cell max-w-[180px] truncate">
                    {c.juzgado}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-foreground max-w-[12rem] truncate hidden md:table-cell">
                    {c.ultimoMovimiento}
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(c.ultimoMovimientoFecha + "T00:00:00").toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkloadBar({ name, cases, total }: { name: string; cases: number; total: number }) {
  const pct = Math.round((cases / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[12px]">
        <span className="font-medium text-foreground">{name}</span>
        <span className="text-muted-foreground">{cases} causas</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), oklch(0.62 0.22 305))",
          }}
        />
      </div>
    </div>
  );
}
