import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Contact, Mail, Phone, MapPin, Building2, User, X, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useClientes, useCausas, useAddCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { type Cliente } from "@/lib/mockData";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes — LexPanel" }] }),
});

function ClientesPage() {
  const { data: clientesData = [], isLoading: isLoadingClientes } = useClientes();
  const { data: causasData = [], isLoading: isLoadingCausas } = useCausas();

  const addClienteMutation = useAddCliente();
  const updateClienteMutation = useUpdateCliente();
  const deleteClienteMutation = useDeleteCliente();
  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const [q, setQ] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"" | "Física" | "Jurídica">("");

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"Física" | "Jurídica">("Física");
  const [cuit, setCuit] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  const isLoading = isLoadingClientes || isLoadingCausas;

  // Filter clients
  const filtered = clientesData.filter((c) => {
    const query = q.toLowerCase();
    const matchesQuery =
      c.nombre.toLowerCase().includes(query) ||
      c.cuit.includes(query) ||
      c.email.toLowerCase().includes(query);
    const matchesTipo = !tipoFilter || c.tipo === tipoFilter;
    return matchesQuery && matchesTipo;
  });

  const resetForm = () => {
    setEditId(null);
    setNombre("");
    setTipo("Física");
    setCuit("");
    setEmail("");
    setTelefono("");
    setDireccion("");
  };

  const openNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (cl: Cliente) => {
    setEditId(cl.id);
    setNombre(cl.nombre);
    setTipo(cl.tipo);
    setCuit(cl.cuit);
    setEmail(cl.email);
    setTelefono(cl.telefono);
    setDireccion(cl.direccion);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cuit.trim()) {
      toast.warning("El nombre y el CUIT son obligatorios.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      tipo,
      cuit: cuit.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
    };

    if (editId) {
      updateClienteMutation.mutate(
        { id: editId, ...datos },
        {
          onSuccess: () => {
            toast.success("Cliente actualizado.");
            setIsOpen(false);
            resetForm();
          },
          onError: () => toast.error("Error al actualizar cliente."),
        },
      );
    } else {
      addClienteMutation.mutate(
        { id: `cli-${Date.now()}`, ...datos },
        {
          onSuccess: () => {
            toast.success("Cliente registrado con éxito.");
            setIsOpen(false);
            resetForm();
          },
          onError: () => toast.error("Error al registrar cliente."),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClienteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Cliente eliminado.", { description: deleteTarget.nombre });
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Error al eliminar cliente.");
        setDeleteTarget(null);
      },
    });
  };

  const isSaving = addClienteMutation.isPending || updateClienteMutation.isPending;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isLoading ? "Cargando directorio..." : `${filtered.length} clientes registrados`}
          </p>
        </div>
        {isSocio && (
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0 touch-target"
          >
            <Plus className="h-4 w-4" /> Agregar Cliente
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, CUIT, correo..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all focus:border-primary/40 focus:ring-primary/10 shadow-sm"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as "" | "Física" | "Jurídica")}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all focus:border-primary/40 focus:ring-primary/10 shadow-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="Física">Persona Física</option>
            <option value="Jurídica">Persona Jurídica</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                <th className="px-5 py-3.5">Razón Social / Nombre</th>
                <th className="px-5 py-3.5">CUIT</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Contacto</th>
                <th className="px-5 py-3.5 hidden lg:table-cell">Dirección</th>
                <th className="px-5 py-3.5 text-center">Causas Activas</th>
                {isSocio && <th className="px-5 py-3.5 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </td>
                      {isSocio && (
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                : filtered.map((cl) => {
                    const activeCases = causasData.filter(
                      (ca) => ca.clienteId === cl.id && ca.estado === "Activo",
                    ).length;
                    return (
                      <tr
                        key={cl.id}
                        className="border-b border-border last:border-0 hover:bg-primary/[0.015] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-full p-2"
                              style={cl.tipo === "Jurídica"
                                ? { background: "oklch(0.17 0.05 282)", color: "oklch(0.65 0.18 282)" }
                                : { background: "oklch(0.17 0.06 240)", color: "oklch(0.70 0.14 240)" }
                              }
                            >
                              {cl.tipo === "Jurídica" ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{cl.nombre}</p>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 block">
                                {cl.tipo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-foreground font-semibold">
                          {cl.cuit}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{cl.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{cl.telefono || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{cl.direccion || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-6 min-w-6 rounded-full text-xs font-bold ${
                              activeCases > 0
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {activeCases}
                          </span>
                        </td>
                        {isSocio && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(cl)}
                                title="Editar cliente"
                                className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(cl)}
                                title="Eliminar cliente"
                                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={isSocio ? 6 : 5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Contact className="h-8 w-8 text-muted-foreground/50" />
                      <p>No se encontraron clientes registrados en el directorio.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {editId
                  ? <><Pencil className="h-4 w-4 text-primary" /> Editar Cliente</>
                  : <><Contact className="h-4.5 w-4.5 text-primary" /> Registrar Nuevo Cliente</>}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Nombre Completo / Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Inversiones del Plata S.A. o Juan Pérez"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as "Física" | "Jurídica")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    <option value="Física">Persona Física</option>
                    <option value="Jurídica">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    CUIT / CUIL
                  </label>
                  <input
                    type="text"
                    required
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="11-XXXX-XXXX"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Nro, Piso, CABA"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
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
                  disabled={isSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50 touch-target"
                >
                  {isSaving ? "Guardando..." : editId ? "Guardar Cambios" : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar Cliente ───────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "oklch(0.17 0.08 22)", border: "1px solid oklch(0.61 0.24 22 / 0.35)" }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: "oklch(0.72 0.20 22)" }} />
                </div>
                <h3 className="font-semibold text-foreground">Eliminar cliente</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                ¿Seguro que querés eliminar a <strong className="text-foreground">{deleteTarget.nombre}</strong>?
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Esta acción no se puede deshacer. Las causas asociadas no se borran, pero quedarán sin cliente vinculado.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleteClienteMutation.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50" style={{ background: "oklch(0.55 0.22 22)" }}>
                  {deleteClienteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
