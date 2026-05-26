import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FolderOpen,
  CalendarClock,
  Activity,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { causas, vencimientos, getAbogado, formatFechaLarga, materiaColor } from "@/lib/mockData";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — LexPanel" }] }),
});

const KPIS = [
  { label: "Total de Causas Activas", value: "6", icon: FolderOpen, hint: "+2 este mes" },
  { label: "Vencimientos Esta Semana", value: "5", icon: CalendarClock, hint: "3 críticos" },
  { label: "Causas con Movimiento Hoy", value: "4", icon: Activity, hint: "26/05/2026" },
  { label: "Honorarios Pendientes", value: "$ 4.820.000", icon: DollarSign, hint: "8 facturas" },
];

function Dashboard() {
  const today = new Date(2026, 4, 23); // Sábado 23 de mayo de 2026
  const activas = causas.filter((c) => c.estado === "Activo");
  const conMovimientoHoy = activas.slice(0, 4);

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 mb-8">
        <p className="text-sm text-muted-foreground capitalize">{formatFechaLarga(today)}</p>
        <h1 className="font-serif text-4xl text-foreground tracking-tight">Buenos días, Laura</h1>
      </div>

      {/* Alert banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            3 vencimientos críticos en los próximos 2 días
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Revisá los expedientes 8.901/2025, 12.345/2024 y 4.567/2024.
          </p>
        </div>
        <Link
          to="/vencimientos"
          className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          Ver detalle <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {k.label}
                </p>
                <div className="rounded-md bg-accent p-1.5 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground tracking-tight">
                {k.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Movimientos de hoy */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Movimientos de Hoy</h2>
          <Link to="/causas" className="text-xs font-medium text-primary hover:underline">
            Ver todas las causas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Carátula</th>
                <th className="px-5 py-3">Juzgado</th>
                <th className="px-5 py-3">Último Movimiento</th>
                <th className="px-5 py-3">Abogado</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {conMovimientoHoy.map((c) => {
                const ab = getAbogado(c.abogadoId);
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-foreground">{c.expediente}</td>
                    <td className="px-5 py-3.5 max-w-md truncate text-foreground">{c.caratula}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{c.juzgado}</td>
                    <td className="px-5 py-3.5 text-foreground">{c.ultimoMovimiento}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{ab?.nombre}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${materiaColor[c.materia]}`}>
                        {c.materia}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
