import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Eye } from "lucide-react";
import { causas, abogados, getAbogado, materiaColor, formatFechaCorta, type Materia, type EstadoCausa } from "@/lib/mockData";

export const Route = createFileRoute("/causas")({
  component: CausasPage,
  head: () => ({ meta: [{ title: "Causas — LexPanel" }] }),
});

const estadoBadge: Record<EstadoCausa, string> = {
  Activo: "bg-primary/10 text-primary ring-1 ring-primary/20",
  Sentencia: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Archivado: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

function CausasPage() {
  const [q, setQ] = useState("");
  const [materia, setMateria] = useState<"" | Materia>("");
  const [abogado, setAbogado] = useState("");
  const [estado, setEstado] = useState<"" | EstadoCausa>("");

  const filtered = causas.filter((c) => {
    if (q && !c.caratula.toLowerCase().includes(q.toLowerCase()) && !c.expediente.includes(q)) return false;
    if (materia && c.materia !== materia) return false;
    if (abogado && c.abogadoId !== abogado) return false;
    if (estado && c.estado !== estado) return false;
    return true;
  });

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">Causas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {filtered.length === 1 ? "causa" : "causas"} en el sistema
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Nueva Causa
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por expediente o carátula…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={materia}
            onChange={(e) => setMateria(e.target.value as Materia | "")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las materias</option>
            <option>Civil</option>
            <option>Laboral</option>
            <option>Familia</option>
            <option>Comercial</option>
          </select>
          <select
            value={abogado}
            onChange={(e) => setAbogado(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los abogados</option>
            {abogados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCausa | "")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option>Activo</option>
            <option>Archivado</option>
            <option>Sentencia</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Carátula</th>
                <th className="px-5 py-3">Materia</th>
                <th className="px-5 py-3">Juzgado</th>
                <th className="px-5 py-3">Abogado</th>
                <th className="px-5 py-3">Últ. Mov.</th>
                <th className="px-5 py-3">Próx. Venc.</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const ab = getAbogado(c.abogadoId);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">{c.expediente}</td>
                    <td className="px-5 py-3.5 max-w-xs truncate">{c.caratula}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${materiaColor[c.materia]}`}>
                        {c.materia}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">{c.juzgado}</td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{ab?.nombre}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{formatFechaCorta(c.ultimoMovimientoFecha)}</td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      {c.proximoVencimiento ? formatFechaCorta(c.proximoVencimiento) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[c.estado]}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/causas/$id"
                        params={{ id: c.id }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                        aria-label="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No se encontraron causas con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
