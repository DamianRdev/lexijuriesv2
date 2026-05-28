import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { abogados, getAbogado, formatFechaCorta, type EstadoVencimiento } from "@/lib/mockData";
import { useVencimientos } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/vencimientos")({
  component: VencimientosPage,
  head: () => ({ meta: [{ title: "Vencimientos — LexPanel" }] }),
});

const badge: Record<EstadoVencimiento, string> = {
  Crítico: "bg-red-50 text-red-700 ring-1 ring-red-200",
  Próximo: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Cumplido: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

const dotColor: Record<EstadoVencimiento, string> = {
  Crítico: "bg-red-500",
  Próximo: "bg-amber-500",
  Cumplido: "bg-emerald-500",
};

function VencimientosPage() {
  const { data: vencimientosData = [], isLoading } = useVencimientos();

  const [month, setMonth] = useState(new Date(2026, 4, 1)); // mayo 2026
  const [filterAb, setFilterAb] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const monthName = month.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

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

  // Deadlines list sorting and filtering by day
  const displayedVencimientos = [...filtered]
    .filter((v) => {
      // If a day is selected, filter deadlines in the list to that specific day
      if (selectedDay) {
        const d = new Date(v.fecha + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === m && d.getDate() === selectedDay;
      }
      return true;
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const handlePrevMonth = () => {
    setMonth(new Date(year, m - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setMonth(new Date(year, m + 1, 1));
    setSelectedDay(null);
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Vencimientos Procesales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calendario de plazos y presentaciones judiciales
          </p>
        </div>
        <select
          value={filterAb}
          onChange={(e) => {
            setFilterAb(e.target.value);
            setSelectedDay(null);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          <option value="">Todos los abogados</option>
          {abogados.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (Columna Izquierda 2/3) */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-md p-1.5 border border-input hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-base font-semibold text-foreground capitalize">{monthName}</h2>
              <button
                onClick={handleNextMonth}
                className="rounded-md p-1.5 border border-input hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-muted-foreground uppercase pb-2 border-b border-border">
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
                    className={`aspect-square rounded-md border p-1.5 flex flex-col justify-between text-sm transition-all cursor-pointer ${
                      d
                        ? isSelected
                          ? "border-primary ring-2 ring-primary/25 bg-primary/5 font-semibold"
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
                                className={`h-1.5 w-1.5 rounded-full ${dotColor[e.estado]}`}
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

          {/* Listado de vencimientos filtrados (Columna Derecha 1/3) */}
          <div className="rounded-lg border border-border bg-card shadow-sm flex flex-col h-[400px] lg:h-auto overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
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

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {displayedVencimientos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2 py-10">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/45" />
                  <p>No se registran vencimientos para el período seleccionado.</p>
                </div>
              ) : (
                displayedVencimientos.map((v) => {
                  const ab = getAbogado(v.abogadoId);
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-md border border-border hover:bg-muted/20 transition-all space-y-1.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                          Exp. {v.expediente}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge[v.estado]}`}
                        >
                          {v.estado}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {v.descripcion}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground">
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
