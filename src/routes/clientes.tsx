import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Contact, Mail, Phone, MapPin, Building2, User, X } from "lucide-react";
import { useClientes, useCausas, useAddCliente } from "@/hooks/useDb";
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
  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const [q, setQ] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"" | "Física" | "Jurídica">("");

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"Física" | "Jurídica">("Física");
  const [cuit, setCuit] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cuit.trim()) {
      toast.warning("El nombre y el CUIT son obligatorios.");
      return;
    }

    const nuevoCliente: Cliente = {
      id: `cli-${Date.now()}`,
      nombre: nombre.trim(),
      tipo,
      cuit: cuit.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
    };

    addClienteMutation.mutate(nuevoCliente, {
      onSuccess: () => {
        toast.success("Cliente registrado con éxito.");
        setIsOpen(false);
        // Reset form
        setNombre("");
        setTipo("Física");
        setCuit("");
        setEmail("");
        setTelefono("");
        setDireccion("");
      },
      onError: () => {
        toast.error("Error al registrar cliente.");
      },
    });
  };

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Cargando directorio..." : `${filtered.length} clientes registrados`}
          </p>
        </div>
        {isSocio && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/95 shadow-sm cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" /> Agregar Cliente
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, CUIT, correo..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as "" | "Física" | "Jurídica")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="">Todos los tipos</option>
            <option value="Física">Persona Física</option>
            <option value="Jurídica">Persona Jurídica</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
                <th className="px-5 py-3">Razón Social / Nombre</th>
                <th className="px-5 py-3">CUIT</th>
                <th className="px-5 py-3 hidden md:table-cell">Contacto</th>
                <th className="px-5 py-3 hidden lg:table-cell">Dirección</th>
                <th className="px-5 py-3 text-center">Causas Activas</th>
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
                    </tr>
                  ))
                : filtered.map((cl) => {
                    const activeCases = causasData.filter(
                      (ca) => ca.clienteId === cl.id && ca.estado === "Activo",
                    ).length;
                    return (
                      <tr
                        key={cl.id}
                        className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${cl.tipo === "Jurídica" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}
                            >
                              {cl.tipo === "Jurídica" ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{cl.nombre}</p>
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                {cl.tipo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-foreground font-semibold">
                          {cl.cuit}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{cl.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{cl.telefono || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{cl.direccion || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-6 min-w-6 rounded-full text-xs font-bold ${
                              activeCases > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {activeCases}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Contact className="h-4 w-4 text-primary" /> Registrar Nuevo Cliente
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Nombre Completo / Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Inversiones del Plata S.A. o Juan Pérez"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as "Física" | "Jurídica")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Física">Persona Física</option>
                    <option value="Jurídica">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    CUIT / CUIL
                  </label>
                  <input
                    type="text"
                    required
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="11-XXXX-XXXX"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Nro, Piso, CABA"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addClienteMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addClienteMutation.isPending ? "Registrando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
