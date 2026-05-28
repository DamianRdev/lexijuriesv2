import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Eye, Scale } from "lucide-react";
import { z } from "zod";
import {
  abogados,
  getAbogado,
  getCliente,
  materiaColor,
  formatFechaCorta,
  type Materia,
  type EstadoCausa,
} from "@/lib/mockData";
import { toast } from "sonner";
import { useCausas } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";

// Esquema de validación para los parámetros de búsqueda en la URL
const causasSearchSchema = z.object({
  q: z.string().optional().catch(""),
  materia: z.enum(["Civil", "Laboral", "Familia", "Comercial", ""]).optional().catch(""),
  abogado: z.string().optional().catch(""),
  estado: z.enum(["Activo", "Archivado", "Sentencia", ""]).optional().catch(""),
});

type CausasSearch = z.infer<typeof causasSearchSchema>;

export const Route = createFileRoute("/causas")({
  validateSearch: (search) => causasSearchSchema.parse(search),
  component: CausasPage,
  head: () => ({ meta: [{ title: "Causas — LexPanel" }] }),
});

const estadoBadge: Record<EstadoCausa, string> = {
  Activo: "bg-primary/10 text-primary ring-1 ring-primary/20",
  Sentencia: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Archivado: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

function CausasPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: causasData = [], isLoading } = useCausas();
  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const q = search.q ?? "";
  const materia = (search.materia as Materia | "") ?? "";
  const abogado = search.abogado ?? "";
  const estado = (search.estado as EstadoCausa | "") ?? "";

  const updateFilters = (newFilters: Partial<CausasSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...newFilters }),
      replace: true,
    });
  };

  const filtered = causasData.filter((c) => {
    if (q && !c.caratula.toLowerCase().includes(q.toLowerCase()) && !c.expediente.includes(q))
      return false;
    if (materia && c.materia !== materia) return false;
    if (abogado && c.abogadoId !== abogado) return false;
    if (estado && c.estado !== estado) return false;
    return true;
  });

  const handleNuevaCausa = () => {
    toast.info("Apertura de formulario de nueva causa (Fase de integración de base de datos).");
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Expedientes y Causas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Cargando causas..."
              : `${filtered.length} ${filtered.length === 1 ? "causa filtrada" : "causas filtradas"} de ${causasData.length} en total`}
          </p>
        </div>
        {isSocio && (
          <button
            onClick={handleNuevaCausa}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/95 shadow-sm cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" /> Registrar Causa
          </button>
        )}
      </div>

      {/* Panel de Filtros */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="Buscar por expediente o carátula…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Selector de Materias */}
          <select
            value={materia}
            onChange={(e) => updateFilters({ materia: e.target.value as CausasSearch["materia"] })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="">Todas las materias</option>
            <option value="Civil">Civil</option>
            <option value="Laboral">Laboral</option>
            <option value="Familia">Familia</option>
            <option value="Comercial">Comercial</option>
          </select>

          {/* Selector de Abogados */}
          <select
            value={abogado}
            onChange={(e) => updateFilters({ abogado: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="">Todos los abogados</option>
            {abogados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          {/* Selector de Estados */}
          <select
            value={estado}
            onChange={(e) => updateFilters({ estado: e.target.value as CausasSearch["estado"] })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Archivado">Archivado</option>
            <option value="Sentencia">Sentencia</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Carátula</th>
                <th className="px-5 py-3">Materia</th>
                <th className="px-5 py-3 hidden md:table-cell">Juzgado</th>
                <th className="px-5 py-3 hidden lg:table-cell">Responsable</th>
                <th className="px-5 py-3 hidden sm:table-cell">Últ. Mov.</th>
                <th className="px-5 py-3">Próx. Venc.</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                : filtered.map((c) => {
                    const ab = getAbogado(c.abogadoId);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                          {c.expediente}
                        </td>
                        <td className="px-5 py-3.5 max-w-xs truncate">
                          <div className="font-semibold text-foreground">{c.caratula}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Cliente:{" "}
                            <span className="font-medium text-foreground/80">
                              {getCliente(c.clienteId)?.nombre}
                            </span>{" "}
                            · <span className="italic">{c.clienteRol}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${materiaColor[c.materia]}`}
                          >
                            {c.materia}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate hidden md:table-cell">
                          {c.juzgado}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                          {ab?.nombre}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                          {formatFechaCorta(c.ultimoMovimientoFecha)}
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap font-medium">
                          {c.proximoVencimiento ? (
                            <span
                              className={
                                c.proximoVencimiento <= "2026-05-29"
                                  ? "text-red-600 font-semibold"
                                  : "text-foreground"
                              }
                            >
                              {formatFechaCorta(c.proximoVencimiento)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${estadoBadge[c.estado]}`}
                          >
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Link
                            to="/causas/$id"
                            params={{ id: c.id }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                            aria-label="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Scale className="h-8 w-8 text-muted-foreground/50" />
                      <p>No se encontraron causas judiciales con esos criterios de búsqueda.</p>
                    </div>
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
