import React, { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  Download,
  Inbox,
  CalendarDays,
  StickyNote,
  CheckSquare,
  Scale,
  User,
  Building2,
  ShieldOff,
} from "lucide-react";
import {
  getAbogado,
  formatFechaCorta,
  type EstadoVencimiento,
  type Materia,
} from "@/lib/mockData";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { audit } from "@/lib/audit";
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

const vencBadgeStyle: Record<EstadoVencimiento, React.CSSProperties> = {
  Crítico: { background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)", boxShadow: "0 0 0 1px oklch(0.72 0.20 22 / 0.2)" },
  Próximo: { background: "oklch(0.18 0.07 65)", color: "oklch(0.76 0.17 65)", boxShadow: "0 0 0 1px oklch(0.76 0.17 65 / 0.2)" },
  Cumplido: { background: "oklch(0.18 0.06 165)", color: "oklch(0.70 0.17 165)", boxShadow: "0 0 0 1px oklch(0.70 0.17 165 / 0.2)" },
};

const materiaBadge: Record<Materia, string> = {
  Civil: "badge-civil",
  Laboral: "badge-laboral",
  Familia: "badge-familia",
  Comercial: "badge-comercial",
};

const estadoBadge: Record<string, string> = {
  Activo: "badge-activo",
  Archivado: "badge-archivado",
  "En sentencia": "badge-sentencia",
};

function getDocIcon(_tipo: string) {
  return FileText;
}

function CausaDetalle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

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

  const isLoading = isLoadingCausa || isLoadingTareas || isLoadingVencs || isLoadingClientes;

  if (isLoading) {
    return (
      <div className="px-4 py-5 sm:px-6 md:px-8 lg:px-10 max-w-[1400px] mx-auto space-y-5 animate-pulse">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!causa) throw notFound();

  // RBAC: Asociado can only access their assigned causas
  if (activeUser && activeUser.role !== "Socio" && causa.abogadoId !== activeUser.abogadoId) {
    audit.log("rbac_denied", activeUser.email, activeUser.role, `causa:${id}`);
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.72 0.20 22 / 0.35)" }}>
          <ShieldOff className="h-8 w-8" style={{ color: "oklch(0.72 0.20 22)" }} />
        </div>
        <div className="text-center max-w-xs">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground">
            No tenés permiso para ver este expediente. Solo podés acceder a las causas asignadas a tu usuario.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/causas" })}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors"
          style={{ background: "var(--color-accent)", color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}
        >
          Volver a Causas
        </button>
      </div>
    );
  }

  const abogado = getAbogado(causa.abogadoId);
  const cliente = clientesData.find((cl) => cl.id === causa.clienteId);
  const vencs = vencsData.filter((v) => v.causaId === causa.id);
  const tareasState = tareasData.filter((t) => t.causaId === causa.id);
  const notas = causa.notas || [];
  const tareasPendientes = tareasState.filter((t) => !t.completada).length;
  const vencCriticos = vencs.filter((v) => v.estado === "Crítico").length;

  const handleGuardarNota = () => {
    if (!nuevaNota.trim()) { toast.warning("La nota no puede estar vacía."); return; }
    updateCausaMutation.mutate(
      { ...causa, notas: [{ id: `nota-${Date.now()}`, autor: activeUser?.nombre || "Dra. Laura Méndez", fecha: new Date().toISOString().split("T")[0], texto: nuevaNota.trim() }, ...notas] },
      { onSuccess: () => { setNuevaNota(""); toast.success("Nota guardada."); }, onError: () => toast.error("Error al guardar.") }
    );
  };

  const handleAddTarea = () => {
    if (!nuevaTareaText.trim()) { toast.warning("La descripción no puede estar vacía."); return; }
    addTareaMutation.mutate(
      { id: `tarea-${Date.now()}`, descripcion: nuevaTareaText.trim(), causaId: causa.id, abogadoId: causa.abogadoId, fechaLimite: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], completada: false, prioridad: nuevaTareaPrioridad },
      { onSuccess: () => { setNuevaTareaText(""); toast.success("Tarea agregada."); }, onError: () => toast.error("Error al agregar.") }
    );
  };

  const toggleTarea = (tareaId: string) => {
    const tarea = tareasState.find((t) => t.id === tareaId);
    if (!tarea) return;
    const updated = { ...tarea, completada: !tarea.completada };
    updateTareaMutation.mutate(updated, {
      onSuccess: () => toast.success(updated.completada ? "Tarea completada." : "Tarea reabierta."),
      onError: () => toast.error("Error al actualizar."),
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* ── Hero header ───────────────────────────────── */}
      <div
        className="px-4 pt-5 pb-6 sm:px-6 md:px-8 lg:px-10 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Subtle radial glow behind title */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-[500px] h-[200px] opacity-10"
          style={{ background: "radial-gradient(ellipse at 0% 0%, oklch(0.62 0.22 282) 0%, transparent 70%)" }}
        />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 relative z-10">
          <Link to="/causas" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Scale className="h-3 w-3" /> Causas
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[40ch] sm:max-w-[60ch] font-medium">{causa.caratula}</span>
        </nav>

        {/* Title row */}
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{ background: "oklch(0.155 0.016 275)", color: "oklch(0.55 0.022 278)" }}>
              Exp. {causa.expediente}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${materiaBadge[causa.materia as Materia] ?? "badge-otra"}`}>
              {causa.materia}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${estadoBadge[causa.estado] ?? "badge-archivado"}`}>
              {causa.estado}
            </span>
            {vencCriticos > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full pulse-critical"
                style={{ background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)" }}>
                ⚠ {vencCriticos} venc. crítico{vencCriticos > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.1rem] text-foreground tracking-tight leading-tight">
            {causa.caratula}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>Juzgado: <strong className="text-foreground/80">{causa.juzgado}</strong></span>
            <span>Resp: <strong className="text-foreground/80">{abogado?.nombre ?? "—"}</strong></span>
            <span>Inicio: <strong className="font-mono text-foreground/80">{formatFechaCorta(causa.fechaInicio)}</strong></span>
          </p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="px-4 py-5 sm:px-6 md:px-8 lg:px-10 space-y-5">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Info cards */}
          <div className="space-y-5">
            {/* Expediente */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 282 / 0.5), transparent)" }} />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Expediente</h2>
              <dl className="space-y-2.5">
                <Field label="Número" value={causa.expediente} mono />
                <Field label="Juzgado" value={causa.juzgado} />
                <Field label="Secretaría" value={causa.secretaria} />
                <Field label="Materia" value={causa.materia} />
                <Field label="Responsable" value={abogado?.nombre ?? "—"} />
                <Field label="Fecha inicio" value={formatFechaCorta(causa.fechaInicio)} mono />
              </dl>
            </div>

            {/* Cliente */}
            {cliente && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 282 / 0.5), transparent)" }} />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Cliente</h2>

                {/* Avatar row */}
                <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={cliente.tipo === "Jurídica"
                      ? { background: "oklch(0.17 0.05 282)", color: "oklch(0.65 0.18 282)" }
                      : { background: "oklch(0.17 0.06 240)", color: "oklch(0.70 0.14 240)" }
                    }>
                    {cliente.tipo === "Jurídica" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cliente.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{cliente.tipo}</span>
                      <span className="text-[10px] font-bold px-1.5 py-px rounded"
                        style={causa.clienteRol === "Actor"
                          ? { background: "oklch(0.18 0.06 165)", color: "oklch(0.70 0.17 165)" }
                          : { background: "oklch(0.17 0.06 240)", color: "oklch(0.70 0.14 240)" }
                        }>
                        {causa.clienteRol}
                      </span>
                    </div>
                  </div>
                </div>

                <dl className="space-y-2.5">
                  <Field label="CUIT" value={cliente.cuit} mono />
                  {cliente.telefono && <Field label="Tel." value={cliente.telefono} />}
                  {cliente.email && <Field label="Email" value={cliente.email} />}
                  {cliente.direccion && <Field label="Dirección" value={cliente.direccion} />}
                </dl>
              </div>
            )}
          </div>

          {/* RIGHT: Timeline */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 282 / 0.5), transparent)" }} />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-4">
              Movimientos Procesales
            </h2>
            <ol className="relative ml-3 space-y-0">
              {causa.movimientos.map((m: any, i: number) => (
                <li key={i} className="pl-6 pb-5 relative"
                  style={{ borderLeft: i < causa.movimientos.length - 1 ? "1px solid var(--color-border)" : "1px solid transparent" }}>
                  {/* dot */}
                  <span
                    className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4"
                    style={{
                      background: i === 0 ? "oklch(0.62 0.22 282)" : "oklch(0.26 0.03 275)",
                      ringColor: "var(--color-card)",
                      boxShadow: i === 0 ? "0 0 0 3px var(--color-card), 0 0 8px oklch(0.62 0.22 282 / 0.4)" : "0 0 0 3px var(--color-card)",
                    }}
                  />
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <p className={`text-sm font-semibold ${i === 0 ? "text-foreground" : "text-foreground/80"}`}>{m.tipo}</p>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap font-mono shrink-0">
                      {formatFechaCorta(m.fecha)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.descripcion}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto no-scrollbar"
            style={{ background: "oklch(0.09 0.016 275)" }}>
            <TabBtn
              active={tab === "docs"}
              onClick={() => setTab("docs")}
              icon={<FileText className="h-3.5 w-3.5" />}
              count={causa.documentos.length}
            >Documentos</TabBtn>
            <TabBtn
              active={tab === "venc"}
              onClick={() => setTab("venc")}
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              count={vencs.length}
              alert={vencCriticos > 0}
            >Vencimientos</TabBtn>
            <TabBtn
              active={tab === "tareas"}
              onClick={() => setTab("tareas")}
              icon={<CheckSquare className="h-3.5 w-3.5" />}
              count={tareasPendientes}
            >Tareas</TabBtn>
            <TabBtn
              active={tab === "notas"}
              onClick={() => setTab("notas")}
              icon={<StickyNote className="h-3.5 w-3.5" />}
              count={notas.length}
            >Notas</TabBtn>
          </div>

          <div className="p-4 sm:p-5">

            {/* DOCS */}
            {tab === "docs" && (
              causa.documentos.length === 0
                ? <EmptyState icon={Inbox} description="No hay documentos cargados en esta causa." />
                : <ul className="divide-y divide-border">
                    {causa.documentos.map((d: any) => {
                      const DocIcon = getDocIcon(d.tipo);
                      return (
                        <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group">
                          <div className="rounded-lg p-2.5 shrink-0"
                            style={{ background: "oklch(0.155 0.016 275)", color: "oklch(0.62 0.22 282)" }}>
                            <DocIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.nombre}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              <span className="font-mono">{d.tipo}</span> · {formatFechaCorta(d.fecha)}
                            </p>
                          </div>
                          <button
                            onClick={() => toast.success(`Descarga iniciada: ${d.nombre}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer shrink-0 px-2 py-1 rounded-md hover:bg-primary/10"
                          >
                            <Download className="h-3.5 w-3.5" /> Descargar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
            )}

            {/* VENCIMIENTOS */}
            {tab === "venc" && (
              vencs.length === 0
                ? <EmptyState icon={CalendarDays} description="No hay vencimientos asociados a esta causa." />
                : <ul className="divide-y divide-border">
                    {vencs.map((v) => (
                      <li key={v.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                        <div className="text-center w-12 shrink-0 rounded-lg py-1.5"
                          style={{ background: "oklch(0.135 0.018 275)", border: "1px solid var(--color-border)" }}>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">
                            {new Date(v.fecha + "T00:00:00").toLocaleDateString("es-AR", { month: "short" })}
                          </p>
                          <p className="text-base font-bold text-foreground leading-tight">
                            {new Date(v.fecha + "T00:00:00").getDate()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">{v.descripcion}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{formatFechaCorta(v.fecha)}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0"
                          style={vencBadgeStyle[v.estado]}>
                          {v.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
            )}

            {/* TAREAS */}
            {tab === "tareas" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2.5 pb-4"
                  style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <input
                    type="text"
                    value={nuevaTareaText}
                    onChange={(e) => setNuevaTareaText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTarea()}
                    placeholder="Nueva tarea (ej. redactar borrador, llamar al perito)..."
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10"
                  />
                  <select
                    value={nuevaTareaPrioridad}
                    onChange={(e) => setNuevaTareaPrioridad(e.target.value as "Alta" | "Media" | "Baja")}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shrink-0"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                  <button
                    onClick={handleAddTarea}
                    disabled={addTareaMutation.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
                {tareasState.length === 0
                  ? <EmptyState icon={CheckSquare} description="No hay tareas agendadas para esta causa." />
                  : <ul className="divide-y divide-border">
                      {tareasState.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => toggleTarea(t.id)}
                              className="shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
                              style={t.completada
                                ? { borderColor: "oklch(0.70 0.17 165)", background: "oklch(0.70 0.17 165)", color: "white" }
                                : { borderColor: "var(--color-border)", background: "transparent" }
                              }
                            >
                              {t.completada && <span className="text-[10px] leading-none">✓</span>}
                            </button>
                            <span className={`text-sm ${t.completada ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                              {t.descripcion}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                              style={t.prioridad === "Alta"
                                ? { background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)" }
                                : t.prioridad === "Media"
                                  ? { background: "oklch(0.18 0.07 65)", color: "oklch(0.76 0.17 65)" }
                                  : { background: "oklch(0.155 0.016 275)", color: "oklch(0.48 0.022 278)" }
                              }>
                              {t.prioridad}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                              {formatFechaCorta(t.fechaLimite)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                }
              </div>
            )}

            {/* NOTAS */}
            {tab === "notas" && (
              <div className="space-y-4">
                <div>
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    rows={3}
                    placeholder="Escribir una nota interna (solo visible para el estudio)…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleGuardarNota}
                      disabled={updateCausaMutation.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Guardar nota
                    </button>
                  </div>
                </div>
                {notas.length === 0
                  ? <EmptyState icon={StickyNote} description="Aún no hay notas en esta causa." />
                  : <ul className="space-y-3">
                      {notas.map((n: any, i: number) => (
                        <li key={n.id} className="rounded-lg p-4 relative overflow-hidden"
                          style={{ background: "oklch(0.11 0.018 275)", border: "1px solid var(--color-border)", borderLeft: "3px solid oklch(0.62 0.22 282 / 0.5)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ background: "oklch(0.62 0.22 282 / 0.15)", color: "oklch(0.62 0.22 282)" }}>
                                {n.autor.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                              </div>
                              <p className="text-xs font-semibold text-foreground">{n.autor}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">{formatFechaCorta(n.fecha)}</p>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{n.texto}</p>
                        </li>
                      ))}
                    </ul>
                }
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid oklch(0.195 0.022 275 / 0.5)" }}>
      <dt className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">{label}</dt>
      <dd className={`text-right text-xs font-semibold text-foreground break-all ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  count,
  alert,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap"
      style={active
        ? { borderBottomColor: "var(--color-primary)", color: "var(--color-primary)", background: "oklch(0.62 0.22 282 / 0.04)" }
        : { borderBottomColor: "transparent", color: "var(--color-muted-foreground)" }
      }
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className="text-[9px] font-bold px-1.5 py-px rounded-full leading-none"
          style={alert
            ? { background: "oklch(0.17 0.08 22)", color: "oklch(0.72 0.20 22)" }
            : { background: active ? "oklch(0.62 0.22 282 / 0.2)" : "oklch(0.155 0.016 275)", color: active ? "oklch(0.62 0.22 282)" : "oklch(0.48 0.022 278)" }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}
