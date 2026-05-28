import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  Download,
  Inbox,
  CalendarDays,
  StickyNote,
  CheckSquare,
} from "lucide-react";
import {
  getAbogado,
  getCliente,
  materiaColor,
  formatFechaCorta,
  type EstadoVencimiento,
} from "@/lib/mockData";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCausa,
  useUpdateCausa,
  useTareas,
  useAddTarea,
  useUpdateTarea,
  useVencimientos,
  useClientes,
} from "@/hooks/useDb";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/causas/$id")({
  component: CausaDetalle,
  head: () => ({ meta: [{ title: "Detalle de causa — LexPanel" }] }),
});

const vencBadge: Record<EstadoVencimiento, string> = {
  Crítico: "bg-red-50 text-red-700 ring-1 ring-red-200",
  Próximo: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Cumplido: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

function CausaDetalle() {
  const { id } = Route.useParams();
  
  const { data: causa, isLoading: isLoadingCausa } = useCausa(id);
  const { data: tareasData = [], isLoading: isLoadingTareas } = useTareas();
  const { data: vencsData = [], isLoading: isLoadingVencs } = useVencimientos();
  const { data: clientesData = [], isLoading: isLoadingClientes } = useClientes();

  const updateCausaMutation = useUpdateCausa();
  const addTareaMutation = useAddTarea();
  const updateTareaMutation = useUpdateTarea();

  const [tab, setTab] = useState<"docs" | "venc" | "notas" | "tareas">("docs");
  const [nuevaNota, setNuevaNota] = useState("");
  const [nuevaTareaText, setNuevaTareaText] = useState("");
  const [nuevaTareaPrioridad, setNuevaTareaPrioridad] = useState<"Alta" | "Media" | "Baja">("Media");

  const activeUser = auth.getUser();
  const isSocio = activeUser?.role === "Socio";

  const isLoading = isLoadingCausa || isLoadingTareas || isLoadingVencs || isLoadingClientes;

  const handleDescargar = (nombreDoc: string) => {
    toast.success(`Descarga iniciada: ${nombreDoc}`);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-16" />
          <ChevronRight className="h-3.5 w-3.5" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!causa) throw notFound();

  const abogado = getAbogado(causa.abogadoId);
  const cliente = clientesData.find((cl) => cl.id === causa.clienteId);
  const vencs = vencsData.filter((v) => v.causaId === causa.id);
  const tareasState = tareasData.filter((t) => t.causaId === causa.id);
  const notas = causa.notas || [];

  const handleGuardarNota = () => {
    if (!nuevaNota.trim()) {
      toast.warning("La nota no puede estar vacía.");
      return;
    }
    const notaNueva = {
      id: `nota-${Date.now()}`,
      autor: activeUser?.nombre || "Dra. Laura Méndez",
      fecha: new Date().toISOString().split("T")[0],
      texto: nuevaNota.trim(),
    };

    updateCausaMutation.mutate({
      ...causa,
      notas: [notaNueva, ...notas],
    }, {
      onSuccess: () => {
        setNuevaNota("");
        toast.success("Nota interna guardada con éxito.");
      },
      onError: () => {
        toast.error("Error al guardar la nota.");
      }
    });
  };

  const handleAddTarea = () => {
    if (!nuevaTareaText.trim()) {
      toast.warning("La descripción de la tarea no puede estar vacía.");
      return;
    }
    const nuevaTarea = {
      id: `tarea-${Date.now()}`,
      descripcion: nuevaTareaText.trim(),
      causaId: causa.id,
      abogadoId: causa.abogadoId,
      fechaLimite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +3 días
      completada: false,
      prioridad: nuevaTareaPrioridad,
    };

    addTareaMutation.mutate(nuevaTarea, {
      onSuccess: () => {
        setNuevaTareaText("");
        toast.success("Tarea interna agregada.");
      },
      onError: () => {
        toast.error("Error al agregar la tarea.");
      }
    });
  };

  const toggleTarea = (tareaId: string) => {
    const tarea = tareasState.find((t) => t.id === tareaId);
    if (!tarea) return;

    const updated = { ...tarea, completada: !tarea.completada };
    updateTareaMutation.mutate(updated, {
      onSuccess: () => {
        toast.success(updated.completada ? "Tarea marcada como completada." : "Tarea reabierta.");
      },
      onError: () => {
        toast.error("Error al actualizar la tarea.");
      }
    });
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/causas" className="hover:text-foreground">
          Causas
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[60ch]">{causa.caratula}</span>
      </nav>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-xs text-muted-foreground">Exp. {causa.expediente}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${materiaColor[causa.materia]}`}
          >
            {causa.materia}
          </span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground tracking-tight">
          {causa.caratula}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Metadata & Client stacked */}
        <div className="space-y-6">
          {/* Causa Info Card */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
              Detalles del Expediente
            </h2>
            <dl className="space-y-3 text-xs">
              <Field label="Expediente" value={causa.expediente} />
              <Field label="Juzgado" value={causa.juzgado} />
              <Field label="Secretaría" value={causa.secretaria} />
              <Field label="Materia" value={causa.materia} />
              <Field label="Responsable" value={abogado?.nombre ?? "—"} />
              <Field label="Fecha inicio" value={formatFechaCorta(causa.fechaInicio)} />
              <Field label="Estado" value={causa.estado} />
            </dl>
          </div>

          {/* Client Card */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
              Ficha del Cliente
            </h2>
            {cliente ? (
              <dl className="space-y-3 text-xs">
                <Field label="Cliente" value={cliente.nombre} />
                <Field label="Tipo" value={cliente.tipo} />
                <Field label="CUIT" value={cliente.cuit} />
                <Field label="Teléfono" value={cliente.telefono} />
                <Field label="Email" value={cliente.email} />
                <Field label="Dirección" value={cliente.direccion} />
                <div className="grid grid-cols-3 gap-3 py-1.5 last:border-0">
                  <dt className="text-xs text-muted-foreground col-span-1 uppercase tracking-wide mt-0.5">
                    Rol procesal
                  </dt>
                  <dd className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        causa.clienteRol === "Actor"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      }`}
                    >
                      {causa.clienteRol}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">No hay información del cliente.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Timeline (taking 2/3 columns on lg) */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
            Últimos movimientos
          </h2>
          <ol className="relative border-l border-border ml-2 space-y-5">
            {causa.movimientos.map((m, i) => (
              <li key={i} className="pl-5 relative">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{m.tipo}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatFechaCorta(m.fecha)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{m.descripcion}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex border-b border-border overflow-x-auto">
          <TabBtn active={tab === "docs"} onClick={() => setTab("docs")}>
            Documentos
          </TabBtn>
          <TabBtn active={tab === "venc"} onClick={() => setTab("venc")}>
            Vencimientos
          </TabBtn>
          <TabBtn active={tab === "tareas"} onClick={() => setTab("tareas")}>
            Tareas Internas
          </TabBtn>
          <TabBtn active={tab === "notas"} onClick={() => setTab("notas")}>
            Notas Internas
          </TabBtn>
        </div>

        <div className="p-5 font-sans">
          {tab === "docs" &&
            (causa.documentos.length === 0 ? (
              <EmptyState icon={Inbox} description="No hay documentos cargados en esta causa." />
            ) : (
              <ul className="divide-y divide-border">
                {causa.documentos.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.tipo} · {formatFechaCorta(d.fecha)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDescargar(d.nombre)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Descargar
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "venc" &&
            (vencs.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                description="No hay vencimientos asociados a esta causa."
              />
            ) : (
              <ul className="divide-y divide-border">
                {vencs.map((v) => (
                  <li key={v.id} className="flex items-center gap-4 py-3">
                    <div className="text-center w-16 shrink-0">
                      <p className="text-xs text-muted-foreground uppercase">
                        {new Date(v.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                          month: "short",
                        })}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {new Date(v.fecha + "T00:00:00").getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{v.descripcion}</p>
                      <p className="text-xs text-muted-foreground">{formatFechaCorta(v.fecha)}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${vencBadge[v.estado]}`}
                    >
                      {v.estado}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "tareas" && (
            <div className="space-y-4">
              {/* Formulario de carga */}
              <div className="flex flex-col sm:flex-row gap-2 border-b border-border/60 pb-4">
                <input
                  type="text"
                  value={nuevaTareaText}
                  onChange={(e) => setNuevaTareaText(e.target.value)}
                  placeholder="Nueva tarea del estudio (ej. redactar borrador, llamar a perito)..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={nuevaTareaPrioridad}
                  onChange={(e) =>
                    setNuevaTareaPrioridad(e.target.value as "Alta" | "Media" | "Baja")
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Baja">Prioridad Baja</option>
                  <option value="Media">Prioridad Media</option>
                  <option value="Alta">Prioridad Alta</option>
                </select>
                <button
                  onClick={handleAddTarea}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
                >
                  Agregar Tarea
                </button>
              </div>

              {/* Listado */}
              {tareasState.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  description="No hay tareas internas agendadas para esta causa."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {tareasState.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={t.completada}
                          onChange={() => toggleTarea(t.id)}
                          className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0 transition-colors"
                        />
                        <span
                          className={`text-sm ${t.completada ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}
                        >
                          {t.descripcion}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            t.prioridad === "Alta"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : t.prioridad === "Media"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-gray-50 text-gray-700 border-gray-100"
                          }`}
                        >
                          {t.prioridad}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Límite: {formatFechaCorta(t.fechaLimite)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "notas" && (
            <div className="space-y-4">
              <div>
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  rows={3}
                  placeholder="Escribir una nota interna (solo visible para miembros del estudio)…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleGuardarNota}
                    className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
                  >
                    Guardar nota
                  </button>
                </div>
              </div>
              {notas.length === 0 ? (
                <EmptyState icon={StickyNote} description="Aún no hay notas en esta causa." />
              ) : (
                <ul className="space-y-3">
                  {notas.map((n) => (
                    <li key={n.id} className="rounded-md border border-border p-3.5 bg-muted/10">
                      <div className="flex items-center justify-between mb-1.5 border-b border-border/50 pb-1">
                        <p className="text-xs font-semibold text-foreground">{n.autor}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFechaCorta(n.fecha)}
                        </p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {n.texto}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 border-b border-border/40 last:border-0">
      <dt className="text-xs text-muted-foreground col-span-1 uppercase tracking-wide mt-0.5">
        {label}
      </dt>
      <dd className="col-span-2 text-foreground font-semibold text-xs break-words">{value}</dd>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
