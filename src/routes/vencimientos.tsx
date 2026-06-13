import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Plus, X, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { abogados, getAbogado, formatFechaCorta, type EstadoVencimiento, type Vencimiento } from "@/lib/mockData";
import { useVencimientos, useCausas, useAddVencimiento, useUpdateVencimiento, useDeleteVencimiento } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { auth } from "@/lib/auth";

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
  const { data: causasData = [] } = useCausas();

  const addVencimientoMutation = useAddVencimiento();
  const updateVencimientoMutation = useUpdateVencimiento();
  const deleteVencimientoMutation = useDeleteVencimiento();
  const isSocio = auth.getUser()?.role === "Socio";

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterAb, setFilterAb] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Alta / edición de vencimiento
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [vCausaId, setVCausaId] = useState("");
  const [vFecha, setVFecha] = useState("");
  const [vDescripcion, setVDescripcion] = useState("");
  const [vEstado, setVEstado] = useState<EstadoVencimiento>("Próximo");

  // Eliminar
  const [deleteTarget, setDeleteTarget] = useState<Vencimiento | null>(null);

  const resetVForm = () => {
    setEditId(null);
    setVCausaId("");
    setVFecha("");
    setVDescripcion("");
    setVEstado("Próximo");
  };

  const openNewVencimiento = () => {
    resetVForm();
    setIsOpen(true);
  };

  const openEditVencimiento = (v: Vencimiento) => {
    setEditId(v.id);
    setVCausaId(v.causaId);
    setVFecha(v.fecha);
    setVDescripcion(v.descripcion);
    setVEstado(v.estado);
    setIsOpen(true);
  };

  const handleSubmitVencimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCausaId || !vFecha || !vDescripcion.trim()) {
      toast.warning("Completá la causa, la fecha y la descripción.");
      return;
    }
    const causa = causasData.find((c) => c.id === vCausaId);
    if (!causa) {
      toast.error("La causa seleccionada no es válida.");
      return;
    }
    const datos = {
      fecha: vFecha,
      descripcion: vDescripcion.trim(),
      causaId: causa.id,
      expediente: causa.expediente,
      abogadoId: causa.abogadoId,
      estado: vEstado,
    };

    if (editId) {
      updateVencimientoMutation.mutate(
        { id: editId, ...datos },
        {
          onSuccess: () => {
            toast.success("Vencimiento actualizado.");
            setIsOpen(false);
            resetVForm();
          },
          onError: () => toast.error("Error al actualizar el vencimiento."),
        },
      );
    } else {
      addVencimientoMutation.mutate(
        { id: `ven-${Date.now()}`, ...datos },
        {
          onSuccess: () => {
            toast.success("Vencimiento registrado.");
            setIsOpen(false);
            resetVForm();
          },
          onError: () => toast.error("Error al registrar el vencimiento."),
        },
      );
    }
  };

  const isSavingVenc = addVencimientoMutation.isPending || updateVencimientoMutation.isPending;

  const handleDeleteVencimiento = () => {
    if (!deleteTarget) return;
    deleteVencimientoMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Vencimiento eliminado.");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Error al eliminar el vencimiento.");
        setDeleteTarget(null);
      },
    });
  };

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

          {isSocio && (
            <button
              onClick={openNewVencimiento}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0 touch-target"
            >
              <Plus className="h-4 w-4" /> Agregar Vencimiento
            </button>
          )}
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
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase"
                            style={badgeStyle[v.estado]}
                          >
                            {v.estado}
                          </span>
                          {isSocio && (
                            <>
                              <button
                                onClick={() => openEditVencimiento(v)}
                                title="Editar vencimiento"
                                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(v)}
                                title="Eliminar vencimiento"
                                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
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

      {/* Modal Agregar Vencimiento */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {editId
                  ? <><Pencil className="h-4 w-4 text-primary" /> Editar Vencimiento</>
                  : <><Calendar className="h-4.5 w-4.5 text-primary" /> Registrar Vencimiento</>}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVencimiento} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Causa / Expediente</label>
                <select
                  required value={vCausaId} onChange={(e) => setVCausaId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                >
                  <option value="">Seleccioná el expediente...</option>
                  {causasData.map((c) => (
                    <option key={c.id} value={c.id}>Exp. {c.expediente} — {c.caratula.slice(0, 35)}…</option>
                  ))}
                </select>
                {causasData.length === 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">No hay causas cargadas. Primero registrá una causa.</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Descripción del plazo</label>
                <input
                  type="text" required value={vDescripcion} onChange={(e) => setVDescripcion(e.target.value)}
                  placeholder="Ej. Vence traslado de la demanda"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Fecha límite</label>
                  <input
                    type="date" required value={vFecha} onChange={(e) => setVFecha(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Estado</label>
                  <select
                    value={vEstado} onChange={(e) => setVEstado(e.target.value as EstadoVencimiento)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    <option value="Próximo">Próximo</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Cumplido">Cumplido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingVenc} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50">
                  {isSavingVenc ? "Guardando..." : editId ? "Guardar Cambios" : "Guardar Vencimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Vencimiento */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.61 0.24 22 / 0.35)" }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: "oklch(0.72 0.20 22)" }} />
                </div>
                <h3 className="font-semibold text-foreground">Eliminar vencimiento</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                ¿Seguro que querés eliminar <strong className="text-foreground">"{deleteTarget.descripcion}"</strong> (Exp. {deleteTarget.expediente})? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleDeleteVencimiento} disabled={deleteVencimientoMutation.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50" style={{ background: "oklch(0.55 0.22 22)" }}>
                  {deleteVencimientoMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
