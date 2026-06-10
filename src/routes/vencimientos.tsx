import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { abogados, getAbogado, formatFechaCorta, type EstadoVencimiento } from "@/lib/mockData";
import { useVencimientos } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/vencimientos")({
  component: VencimientosPage,
  head: () => ({ meta: [{ title: "Vencimientos — LexPanel" }] }),
});const badgeStyle: Record<EstadoVencimiento, React.CSSProperties> = {
  Crítico: { background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)", boxShadow: "0 0 0 1px oklch(0.72 0.20 22 / 0.2)" },
  Próximo: { background: "oklch(0.18 0.07 65)", color: "oklch(0.76 0.17 65)", boxShadow: "0 0 0 1px oklch(0.76 0.17 65 / 0.2)" },
  Cumplido: { background: "oklch(0.18 0.06 165)", color: "oklch(0.70 0.17 165)", boxShadow: "0 0 0 1px oklch(0.70 0.17 165 / 0.2)" },
};

const dotStyle: Record<EstadoVencimiento, React.CSSProperties> = {
  Crítico: { background: "oklch(0.72 0.20 22)" },
  Próximo: { background: "oklch(0.76 0.17 65)" },
  Cumplido: { background: "oklch(0.70 0.17 165)" },
};

function VencimientosPage() {
  const { data: vencimientosData = [], isLoading } = useVencimientos();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterAb, setFilterAb] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const monthName = month.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    setMonth(new Date(year, m - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setMonth(new Date(year, m + 1, 1));
    setSelectedDay(null);
  };

  // Filter and sort deadlines
  const filtered = vencimientosData.filter((v) => !filterAb || v.abogadoId === filterAb);

  // Map day -> deadlines for calendar cells
  const byDay: Record<number, typeof vencimientosData> = {};
  filtered.forEach((v) => {
    const d = new Date(v.fecha + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === m) {
      const day = d.getDate();
      (byDay[day] ||= []).push(v);
    }
  });

  // Calculate grid cells
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Deadlines list sorting and filtering by day/month
  const displayedVencimientos = [...filtered]
    .filter((v) => {
      const d = new Date(v.fecha + "T00:00:00");
      if (d.getFullYear() !== year || d.getMonth() !== m) return false;
      if (selectedDay) {
        return d.getDate() === selectedDay;
      }
      return true;
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Vencimientos Procesales
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Calendario de plazos y presentaciones judiciales
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Controles de Mes (siempre visibles) */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-all cursor-pointer touch-target flex items-center justify-center"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground px-2 capitalize min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-all cursor-pointer touch-target flex items-center justify-center"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <select
            value={filterAb}
            onChange={(e) => {
              setFilterAb(e.target.value);
              setSelectedDay(null);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm grow sm:grow-0"
          >
            <option value="">Todos los abogados</option>
            {abogados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
          <Skeleton className="h-96 lg:col-span-2 hidden sm:block" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {/* Calendar Grid (Columna Izquierda 2/3 - oculta en móvil) */}
          <div className="hidden sm:block sm:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-7 gap-px text-center text-xs font-bold text-muted-foreground uppercase pb-2 border-b border-border">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const evs = d ? byDay[d] : undefined;
                const isSelected = selectedDay === d;
                return (
                  <div
                    key={i}
                    onClick={() => d && setSelectedDay(isSelected ? null : d)}
                    className={`aspect-square rounded-lg border p-1.5 flex flex-col justify-between text-sm transition-all cursor-pointer ${
                      d
                        ? isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold"
                          : evs
                            ? "border-primary/20 bg-background hover:bg-accent/40"
                            : "border-border bg-background hover:bg-muted/50"
                        : "border-transparent bg-transparent cursor-default pointer-events-none"
                    }`}
                  >
                    {d && (
                      <>
                        <span
                          className={`text-xs ${isSelected ? "text-primary font-bold" : "text-muted-foreground"}`}
                        >
                          {d}
                        </span>
                        {evs && (
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {evs.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                className="h-1.5 w-1.5 rounded-full"
                                style={dotStyle[e.estado]}
                                title={`${e.descripcion} (Exp. ${e.expediente})`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listado de vencimientos (Columna Derecha 1/3, en móvil toma full width) */}
          <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col min-h-[400px] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
            <div className="px-5 py-4 border-b border-border bg-muted/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                {selectedDay ? `Vencimientos del día ${selectedDay}` : "Vencimientos del mes"}
              </h2>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Ver todo
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
              {displayedVencimientos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2 py-16">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                  <p>No se registran vencimientos para el período seleccionado.</p>
                </div>
              ) : (
                displayedVencimientos.map((v) => {
                  const ab = getAbogado(v.abogadoId);
                  return (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-lg border border-border hover:bg-primary/[0.005] transition-all space-y-2 group"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                          Exp. {v.expediente}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase"
                          style={badgeStyle[v.estado]}
                        >
                          {v.estado}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {v.descripcion}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <span>Resp: {ab?.nombre}</span>
                        <span className="font-mono">{formatFechaCorta(v.fecha)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
