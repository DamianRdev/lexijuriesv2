import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  vencimientos,
  abogados,
  getAbogado,
  formatFechaCorta,
  type EstadoVencimiento,
} from "@/lib/mockData";

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
  const [month, setMonth] = useState(new Date(2026, 4, 1)); // mayo 2026
  const [filterAb, setFilterAb] = useState("");

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const monthName = month.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const filtered = vencimientos.filter((v) => !filterAb || v.abogadoId === filterAb);
  const sorted = [...filtered].sort((a, b) => a.fecha.localeCompare(b.fecha));

  // map day -> deadlines
  const byDay: Record<number, typeof vencimientos> = {};
  filtered.forEach((v) => {
    const d = new Date(v.fecha + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === m) {
      const day = d.getDate();
      (byDay[day] ||= []).push(v);
    }
  });

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">Vencimientos</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendario y próximas obligaciones procesales</p>
        </div>
        <select
          value={filterAb}
          onChange={(e) => setFilterAb(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los abogados</option>
          {abogados.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setMonth(new Date(year, m - 1, 1))}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-semibold text-foreground capitalize">{monthName}</h2>
          <button
            onClick={() => setMonth(new Date(year, m + 1, 1))}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground uppercase mb-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const evs = d ? byDay[d] : undefined;
            return (
              <div
                key={i}
                className={`aspect-square rounded-md border p-1.5 flex flex-col text-sm ${
                  d ? "border-border bg-background" : "border-transparent"
                }`}
              >
                {d && (
                  <>
                    <span className="text-xs text-muted-foreground">{d}</span>
                    {evs && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {evs.slice(0, 4).map((e) => (
                          <span
                            key={e.id}
                            className={`h-1.5 w-1.5 rounded-full ${dotColor[e.estado]}`}
                            title={e.descripcion}
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

      {/* List */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Próximos vencimientos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3">Abogado</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => {
                const ab = getAbogado(v.abogadoId);
                return (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3.5 whitespace-nowrap text-foreground">{formatFechaCorta(v.fecha)}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{v.expediente}</td>
                    <td className="px-5 py-3.5 text-foreground">{v.descripcion}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{ab?.nombre}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge[v.estado]}`}>
                        {v.estado}
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
