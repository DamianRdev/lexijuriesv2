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
  RotateCw,
  FileText,
  User,
  Scale,
} from "lucide-react";
import { getAbogado, formatFechaLarga, materiaColor, abogados } from "@/lib/mockData";
import { toast } from "sonner";
import { useCausas, useVencimientos } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — LexPanel" }] }),
});

function Dashboard() {
  const { data: causasData = [], isLoading: isLoadingCausas } = useCausas();
  const { data: vencimientosData = [], isLoading: isLoadingVencs } = useVencimientos();

  const isLoading = isLoadingCausas || isLoadingVencs;

  // Ajuste de fecha a "hoy" en base a los mocks: Martes 26 de Mayo de 2026
  const todayStr = "2026-05-26";
  const today = new Date(2026, 4, 26);

  // ─── CÁLCULOS DINÁMICOS ───
  const activasCount = causasData.filter((c) => c.estado === "Activo").length;

  // Vencimientos activos no cumplidos posteriores o iguales a "hoy"
  const vencimientosActivos = vencimientosData.filter(
    (v) => v.estado !== "Cumplido" && v.fecha >= todayStr,
  );

  // Vencimientos urgentes (Crítico)
  const criticos = vencimientosActivos.filter((v) => v.estado === "Crítico");
  const criticosCount = criticos.length;

  // Vencimientos en los próximos 7 días (hasta 02-Jun-2026)
  const semanaVencimientosCount = vencimientosActivos.filter((v) => v.fecha <= "2026-06-02").length;

  // Causas actualizadas en la fecha de hoy
  const conMovimientoHoyCount = causasData.filter(
    (c) => c.ultimoMovimientoFecha === todayStr,
  ).length;

  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  // KPIs
  const KPIS = [
    {
      label: "Causas Activas",
      value: activasCount.toString(),
      icon: FolderOpen,
      hint: "+2 este mes",
      alert: false,
    },
    {
      label: "Urgencias (Críticos)",
      value: criticosCount.toString(),
      icon: AlertTriangle,
      hint: `${semanaVencimientosCount} esta semana`,
      alert: criticosCount > 0,
    },
    {
      label: "Novedades de Hoy",
      value: conMovimientoHoyCount.toString(),
      icon: Activity,
      hint: "Movimientos registrados hoy",
      alert: false,
    },
    {
      label: "Honorarios Pendientes",
      value: isSocio ? "$4.820.000" : "Restringido",
      icon: DollarSign,
      hint: isSocio ? "8 facturas activas" : "Solo para Socios",
      alert: false,
    },
  ];

  // ─── ACCIONES SIMULADAS ───
  const handleSync = () => {
    const promise = () =>
      new Promise((resolve) => setTimeout(() => resolve({ name: "LexPanel" }), 1800));
    toast.promise(promise, {
      loading: "Conectando con servidores de PJN y SCBA MEV...",
      success: "Sincronización procesal exitosa. Se actualizaron las causas en LocalStorage.",
      error: "Error al sincronizar con el portal del Poder Judicial.",
    });
  };

  const handleQuickAction = (actionName: string) => {
    toast.info(`Acción rápida: "${actionName}" (Acción lista en el sistema de base de datos).`);
  };

  // Vencimientos ordenados por proximidad
  const vencimientosProximos = [...vencimientosActivos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 3);

  // Causas ordenadas por última actualización
  const causasRecientes = [...causasData]
    .sort((a, b) => b.ultimoMovimientoFecha.localeCompare(a.ultimoMovimientoFecha))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex justify-between items-center pb-5 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {formatFechaLarga(today)}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight mt-1">
            Hola de nuevo, Laura
          </h1>
        </div>
        <button
          onClick={handleSync}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <RotateCw className="h-4 w-4" /> Sincronizar Juzgados
        </button>
      </div>

      {/* Alerta Dinámica */}
      {criticosCount > 0 && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50/60 p-4 animate-in fade-in duration-300">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-900">
                Atención: Tenés {criticosCount} vencimientos procesales inminentes
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Escritos críticos pendientes para los expedientes:{" "}
                <span className="font-semibold font-mono">
                  {criticos.map((v) => v.expediente).join(", ")}
                </span>
                .
              </p>
            </div>
          </div>
          <Link
            to="/vencimientos"
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            Resolver plazos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className={`rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
                k.alert ? "border-red-200 ring-1 ring-red-100" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {k.label}
                </p>
                <div
                  className={`rounded-md p-1.5 ${
                    k.alert ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {k.value}
                {k.value === "Restringido" && (
                  <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20">
                    Socio
                  </span>
                )}
              </p>
              <p
                className={`mt-1 text-xs ${k.alert ? "text-red-600 font-medium" : "text-muted-foreground"}`}
              >
                {k.hint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Zona Operativa Central (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Vencimientos (Columna Izquierda 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  Plazos Judiciales Inminentes
                </h2>
              </div>
              <Link
                to="/vencimientos"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                Ver calendario <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              {vencimientosProximos.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No hay vencimientos pendientes para los próximos días.
                </div>
              ) : (
                <div className="space-y-4">
                  {vencimientosProximos.map((v) => {
                    const ab = getAbogado(v.abogadoId);
                    return (
                      <div
                        key={v.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              Exp. {v.expediente}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                v.estado === "Crítico"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
                              {v.estado}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{v.descripcion}</p>
                          <p className="text-xs text-muted-foreground">Asignado: {ab?.nombre}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right sm:text-right">
                            <p className="text-xs font-semibold text-muted-foreground">VENCE EL</p>
                            <p className="text-sm font-bold text-foreground">
                              {new Date(v.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </p>
                          </div>
                          <Link
                            to="/causas/$id"
                            params={{ id: v.causaId }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-muted hover:text-primary transition-colors"
                            title="Ver expediente"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas (Columna Derecha 1/3) */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Acciones Rápidas
            </h2>
            <p className="text-xs text-muted-foreground">
              Accesos directos para agilizar la carga operativa del estudio.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleQuickAction("Nueva Causa")}
                className="w-full flex items-center gap-3 rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer text-left"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>Registrar Nueva Causa</span>
              </button>
              <button
                onClick={() => handleQuickAction("Agendar Vencimiento")}
                className="w-full flex items-center gap-3 rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer text-left"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span>Agendar Vencimiento</span>
              </button>
              <button
                onClick={() => handleQuickAction("Nueva Nota")}
                className="w-full flex items-center gap-3 rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer text-left"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Redactar Nota Rápida</span>
              </button>
            </div>
          </div>

          {/* Carga por Abogado */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Distribución del Estudio
            </h2>
            <div className="space-y-3.5">
              {abogados.map((ab) => {
                const casesCount = causasData.filter(
                  (c) => c.abogadoId === ab.id && c.estado === "Activo",
                ).length;
                return (
                  <WorkloadBar
                    key={ab.id}
                    name={ab.nombre}
                    cases={casesCount}
                    total={activasCount || 1}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Procesal Reciente (Tabla Inferior) */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Actividad Procesal Reciente</h2>
          <Link to="/causas" className="text-xs font-medium text-primary hover:underline">
            Ver todas las causas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Carátula</th>
                <th className="px-5 py-3 hidden md:table-cell">Materia</th>
                <th className="px-5 py-3 hidden lg:table-cell">Juzgado</th>
                <th className="px-5 py-3">Último Proveído / Movimiento</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {causasRecientes.map((c) => {
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {c.expediente}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-foreground font-medium">
                      <Link
                        to="/causas/$id"
                        params={{ id: c.id }}
                        className="hover:text-primary hover:underline"
                      >
                        {c.caratula}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${materiaColor[c.materia]}`}
                      >
                        {c.materia}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell max-w-[200px] truncate">
                      {c.juzgado}
                    </td>
                    <td className="px-5 py-3.5 text-foreground max-w-sm truncate">
                      {c.ultimoMovimiento}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(c.ultimoMovimientoFecha + "T00:00:00").toLocaleDateString("es-AR")}
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

// Subcomponente Auxiliar
function WorkloadBar({ name, cases, total }: { name: string; cases: number; total: number }) {
  const percentage = (cases / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{name}</span>
        <span className="text-muted-foreground">{cases} causas</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
