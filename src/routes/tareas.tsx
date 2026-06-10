import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  CheckSquare,
  Square,
  Search,
  ListTodo,
  Calendar,
  AlertCircle,
  FolderOpen,
  User,
  X,
} from "lucide-react";
import { useTareas, useCausas, useAddTarea, useUpdateTarea } from "@/hooks/useDb";
import { abogados, type Tarea } from "@/lib/mockData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/tareas")({
  component: TareasPage,
  head: () => ({ meta: [{ title: "Tareas — LexPanel" }] }),
});

function TareasPage() {
  const { data: tareasData = [], isLoading: isLoadingTareas } = useTareas();
  const { data: causasData = [], isLoading: isLoadingCausas } = useCausas();

  const addTareaMutation = useAddTarea();
  const updateTareaMutation = useUpdateTarea();
  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const [q, setQ] = useState("");
  const [filterCausa, setFilterCausa] = useState("");
  const [filterAbogado, setFilterAbogado] = useState("");

  // Modal form state
  const [isOpen, setIsOpen] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [causaId, setCausaId] = useState("");
  const [abogadoId, setAbogadoId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState<"Alta" | "Media" | "Baja">("Media");

  const isLoading = isLoadingTareas || isLoadingCausas;

  // Filter tasks
  const filtered = tareasData.filter((t) => {
    const matchesQ = !q || t.descripcion.toLowerCase().includes(q.toLowerCase());
    const matchesCausa = !filterCausa || t.causaId === filterCausa;
    const matchesAbogado = !filterAbogado || t.abogadoId === filterAbogado;
    return matchesQ && matchesCausa && matchesAbogado;
  });

  const pendientes = filtered.filter((t) => !t.completada);
  const completadas = filtered.filter((t) => t.completada);

  const toggleTareaStatus = (t: Tarea) => {
    const updated: Tarea = { ...t, completada: !t.completada };
    updateTareaMutation.mutate(updated, {
      onSuccess: () => {
        toast.success(updated.completada ? "Tarea completada." : "Tarea reabierta.");
      },
    });
  };

  const handleCreateTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !causaId || !abogadoId || !fechaLimite) {
      toast.warning("Por favor completa todos los campos del formulario.");
      return;
    }

    const nuevaTarea: Tarea = {
      id: `tar-${Date.now()}`,
      descripcion: descripcion.trim(),
      causaId,
      abogadoId,
      fechaLimite,
      completada: false,
      prioridad,
    };

    addTareaMutation.mutate(nuevaTarea, {
      onSuccess: () => {
        toast.success("Tarea registrada correctamente en el estudio.");
        setIsOpen(false);
        // Reset form
        setDescripcion("");
        setCausaId("");
        setAbogadoId("");
        setFechaLimite("");
        setPrioridad("Media");
      },
      onError: () => {
        toast.error("Error al registrar la tarea.");
      },
    });
  };

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Tareas del Estudio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Cargando tablero..."
              : `${pendientes.length} tareas pendientes · ${completadas.length} completadas`}
          </p>
        </div>
        {isSocio && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0 touch-target"
          >
            <Plus className="h-4 w-4" /> Asignar Tarea
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por descripción..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all focus:border-primary/40 focus:ring-primary/10 shadow-sm"
            />
          </div>
          <select
            value={filterCausa}
            onChange={(e) => setFilterCausa(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all focus:border-primary/40 focus:ring-primary/10 shadow-sm"
          >
            <option value="">Todas las causas</option>
            {causasData.map((c) => (
              <option key={c.id} value={c.id}>
                Exp. {c.expediente} · {c.caratula.slice(0, 30)}...
              </option>
            ))}
          </select>
          <select
            value={filterAbogado}
            onChange={(e) => setFilterAbogado(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all focus:border-primary/40 focus:ring-primary/10 shadow-sm"
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

      {/* Kanban/Side-by-Side Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Column 1: Pendientes */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col min-h-[500px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
          <div className="px-5 py-4 border-b border-border bg-muted/5 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Square className="h-4.5 w-4.5 text-primary" /> Pendientes por Resolver
            </h2>
            <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
              {pendientes.length}
            </span>
          </div>

          <div className="p-5 flex-1 divide-y divide-border/60 space-y-3.5 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-2 space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : pendientes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-sm text-muted-foreground gap-2">
                <ListTodo className="h-8 w-8 text-muted-foreground/45" />
                <p>¡Buen trabajo! No hay tareas pendientes en este filtro.</p>
              </div>
            ) : (
              pendientes.map((t) => {
                const c = causasData.find((causa) => causa.id === t.causaId);
                const ab = abogados.find((abogado) => abogado.id === t.abogadoId);
                return (
                  <div key={t.id} className="flex items-start gap-3.5 pt-3.5 first:pt-0 group hover:bg-primary/[0.005] transition-colors rounded-lg">
                    <button
                      onClick={() => toggleTareaStatus(t)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0 touch-target flex items-center justify-center"
                    >
                      <Square className="h-4.5 w-4.5" />
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {t.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {c && (
                          <Link
                            to="/causas/$id"
                            params={{ id: c.id }}
                            className="hover:underline flex items-center gap-1 text-[11px] text-primary/80"
                          >
                            <FolderOpen className="h-3 w-3" /> Exp. {c.expediente}
                          </Link>
                        )}
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="h-3 w-3" /> {ab?.nombre}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono">
                          <Calendar className="h-3 w-3" /> Límite: {t.fechaLimite}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
                      style={t.prioridad === "Alta"
                        ? { background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)" }
                        : t.prioridad === "Media"
                          ? { background: "oklch(0.18 0.07 65)", color: "oklch(0.76 0.17 65)" }
                          : { background: "oklch(0.155 0.016 275)", color: "oklch(0.48 0.022 278)" }
                      }
                    >
                      {t.prioridad}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Completadas */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col min-h-[500px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "oklch(0.70 0.17 165 / 0.5)" }} />
          <div className="px-5 py-4 border-b border-border bg-muted/5 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4.5 w-4.5" style={{ color: "oklch(0.70 0.17 165)" }} /> Historial de Completadas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "oklch(0.18 0.06 165)", color: "oklch(0.70 0.17 165)" }}>
              {completadas.length}
            </span>
          </div>

          <div className="p-5 flex-1 divide-y divide-border/60 space-y-3.5 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="py-2 space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : completadas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-sm text-muted-foreground gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/45" />
                <p>Las tareas completadas aparecerán aquí.</p>
              </div>
            ) : (
              completadas.map((t) => {
                const c = causasData.find((causa) => causa.id === t.causaId);
                const ab = abogados.find((abogado) => abogado.id === t.abogadoId);
                return (
                  <div key={t.id} className="flex items-start gap-3.5 pt-3.5 first:pt-0">
                    <button
                      onClick={() => toggleTareaStatus(t)}
                      className="mt-0.5 transition-colors cursor-pointer shrink-0 touch-target flex items-center justify-center"
                      style={{ color: "oklch(0.70 0.17 165)" }}
                    >
                      <CheckSquare className="h-4.5 w-4.5" />
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground line-through leading-tight">
                        {t.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {c && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <FolderOpen className="h-3 w-3" /> Exp. {c.expediente}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="h-3 w-3" /> {ab?.nombre}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assign Task Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ListTodo className="h-4.5 w-4.5 text-primary" /> Asignar Tarea del Estudio
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTarea} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Descripción de la Tarea
                </label>
                <input
                  type="text"
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Redactar pliego de posiciones para la pericia"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Asociar a Causa Judicial
                </label>
                <select
                  required
                  value={causaId}
                  onChange={(e) => setCausaId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                >
                  <option value="">Selecciona expediente...</option>
                  {causasData.map((c) => (
                    <option key={c.id} value={c.id}>
                      Exp: {c.expediente} — {c.caratula.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Abogado Asignado
                  </label>
                  <select
                    required
                    value={abogadoId}
                    onChange={(e) => setAbogadoId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    <option value="">Asignar a...</option>
                    {abogados.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Prioridad Operativa
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as "Alta" | "Media" | "Baja")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                >
                  <option value="Baja">Prioridad Baja</option>
                  <option value="Media">Prioridad Media</option>
                  <option value="Alta">Prioridad Alta</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 cursor-pointer touch-target"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addTareaMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50 touch-target"
                >
                  {addTareaMutation.isPending ? "Asignando..." : "Asignar Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
