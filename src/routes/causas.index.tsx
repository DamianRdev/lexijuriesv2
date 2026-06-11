import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Eye, Scale, X, FolderPlus } from "lucide-react";
import { z } from "zod";
import {
  abogados,
  getAbogado,
  formatFechaCorta,
  type Materia,
  type EstadoCausa,
  type Causa,
} from "@/lib/mockData";
import { toast } from "sonner";
import { useCausas, useClientes, useAddCausa } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prefs } from "@/lib/prefs";

const causasSearchSchema = z.object({
  q: z.string().optional().catch(""),
  materia: z.enum(["Civil", "Laboral", "Familia", "Comercial", ""]).optional().catch(""),
  abogado: z.string().optional().catch(""),
  estado: z.enum(["Activo", "Archivado", "Sentencia", ""]).optional().catch(""),
});

type CausasSearch = z.infer<typeof causasSearchSchema>;

export const Route = createFileRoute("/causas/")({
  validateSearch: (search) => causasSearchSchema.parse(search),
  component: CausasPage,
  head: () => ({ meta: [{ title: "Causas — LexPanel" }] }),
});

const MATERIAS: Materia[] = ["Civil", "Laboral", "Familia", "Comercial"];
const ESTADOS: EstadoCausa[] = ["Activo", "Archivado", "Sentencia"];

const materiaClass: Record<Materia, string> = {
  Civil: "badge-civil",
  Laboral: "badge-laboral",
  Familia: "badge-familia",
  Comercial: "badge-comercial",
};

const estadoClass: Record<EstadoCausa, string> = {
  Activo: "badge-activo",
  Sentencia: "badge-sentencia",
  Archivado: "badge-archivado",
};

function CausasPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: causasData = [], isLoading } = useCausas();
  const { data: clientesData = [] } = useClientes();
  const user = auth.getUser();
  const isSocio = user?.role === "Socio";

  const getClienteById = (id: string) => clientesData.find((c) => c.id === id);

  const q = search.q ?? "";
  const materia = (search.materia as Materia | "") ?? "";
  const abogado = search.abogado ?? "";
  const estado = (search.estado as EstadoCausa | "") ?? "";

  const setFilter = (newFilters: Partial<CausasSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...newFilters }), replace: true });

  const clearAll = () =>
    navigate({ search: {}, replace: true });

  const hasFilters = q || materia || abogado || estado;

  // RBAC: Asociado only sees their assigned causas
  const visibleCausas = isSocio
    ? causasData
    : causasData.filter((c) => c.abogadoId === user?.abogadoId);

  // Preference: hide archived causas from the default listing unless the user
  // explicitly filters by the "Archivado" estado.
  const showArchived = prefs.get("showArchived");

  const filtered = visibleCausas.filter((c) => {
    if (!showArchived && estado !== "Archivado" && c.estado === "Archivado") return false;
    if (q && !c.caratula.toLowerCase().includes(q.toLowerCase()) && !c.expediente.includes(q))
      return false;
    if (materia && c.materia !== materia) return false;
    if (abogado && c.abogadoId !== abogado) return false;
    if (estado && c.estado !== estado) return false;
    return true;
  });

  const today = new Date().toISOString().split("T")[0];

  // ── Modal "Registrar Causa" ──
  const addCausaMutation = useAddCausa();
  const [isOpen, setIsOpen] = useState(false);
  const [expediente, setExpediente] = useState("");
  const [caratula, setCaratula] = useState("");
  const [fMateria, setFMateria] = useState<Materia>("Civil");
  const [juzgado, setJuzgado] = useState("");
  const [secretaria, setSecretaria] = useState("Secretaría Única");
  const [fAbogadoId, setFAbogadoId] = useState(user?.abogadoId ?? abogados[0]?.id ?? "");
  const [fClienteId, setFClienteId] = useState("");
  const [clienteRol, setClienteRol] = useState<"Actor" | "Demandado">("Actor");
  const [fechaInicio, setFechaInicio] = useState(today);

  const resetForm = () => {
    setExpediente("");
    setCaratula("");
    setFMateria("Civil");
    setJuzgado("");
    setSecretaria("Secretaría Única");
    setFAbogadoId(user?.abogadoId ?? abogados[0]?.id ?? "");
    setFClienteId("");
    setClienteRol("Actor");
    setFechaInicio(today);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expediente.trim() || !caratula.trim()) {
      toast.warning("El expediente y la carátula son obligatorios.");
      return;
    }
    if (!fClienteId) {
      toast.warning("Seleccioná el cliente de la causa.");
      return;
    }

    const nuevaCausa: Causa = {
      id: `causa-${Date.now()}`,
      expediente: expediente.trim(),
      caratula: caratula.trim(),
      materia: fMateria,
      juzgado: juzgado.trim(),
      secretaria: secretaria.trim(),
      abogadoId: fAbogadoId,
      clienteId: fClienteId,
      clienteRol,
      fechaInicio,
      estado: "Activo",
      ultimoMovimiento: "Apertura del expediente",
      ultimoMovimientoFecha: today,
      movimientos: [{ fecha: today, tipo: "Inicio", descripcion: "Apertura del expediente." }],
      documentos: [],
      notas: [],
    };

    addCausaMutation.mutate(nuevaCausa, {
      onSuccess: () => {
        if (user) audit.log("create_causa", user.email, user.role, `exp:${nuevaCausa.expediente}`);
        toast.success("Causa registrada con éxito.", { description: nuevaCausa.expediente });
        setIsOpen(false);
        resetForm();
      },
      onError: () => {
        toast.error("Error al registrar la causa.");
      },
    });
  };

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-5 sm:space-y-6">

      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Expedientes y Causas
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            {isLoading
              ? "Cargando causas..."
              : isSocio
                ? `${filtered.length} causa${filtered.length !== 1 ? "s" : ""} de ${causasData.length} en total`
                : `${filtered.length} causa${filtered.length !== 1 ? "s" : ""} asignadas a tu usuario`}
          </p>
        </div>
        {isSocio && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              boxShadow: "0 0 16px oklch(0.62 0.22 282 / 0.25)",
            }}
          >
            <Plus className="h-4 w-4" /> Registrar Causa
          </button>
        )}
      </div>

      {/* ── Search + Filters ───────────────── */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setFilter({ q: e.target.value })}
            placeholder="Buscar por expediente, carátula o cliente…"
            className="w-full rounded-xl pl-10 pr-10 py-2.5 text-[13px] transition-all focus:outline-none"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.boxShadow = "0 0 0 3px oklch(0.62 0.22 282 / 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
              e.target.style.boxShadow = "none";
            }}
          />
          {q && (
            <button
              onClick={() => setFilter({ q: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Materia pills */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter({ materia: "" })}
              className="rounded-full px-3 py-1 text-[11px] font-medium transition-all"
              style={{
                background: !materia ? "var(--color-primary)" : "var(--color-card)",
                color: !materia ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                border: `1px solid ${!materia ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              Todas
            </button>
            {MATERIAS.map((m) => (
              <button
                key={m}
                onClick={() => setFilter({ materia: materia === m ? "" : m })}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition-all"
                style={{
                  background: materia === m ? "var(--color-primary)" : "var(--color-card)",
                  color: materia === m ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                  border: `1px solid ${materia === m ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Estado pills */}
          <div className="flex gap-1.5 flex-wrap">
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => setFilter({ estado: estado === e ? "" : e })}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition-all"
                style={{
                  background: estado === e ? "var(--color-primary)" : "var(--color-card)",
                  color: estado === e ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                  border: `1px solid ${estado === e ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Abogado select */}
          <select
            value={abogado}
            onChange={(e) => setFilter({ abogado: e.target.value })}
            className="rounded-full px-3 py-1 text-[11px] font-medium transition-all focus:outline-none cursor-pointer"
            style={{
              background: abogado ? "var(--color-primary)" : "var(--color-card)",
              color: abogado ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
              border: `1px solid ${abogado ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            <option value="">Todos los abogados</option>
            {abogados.map((a) => (
              <option key={a.id} value={a.id} style={{ background: "var(--color-card)", color: "var(--color-foreground)" }}>
                {a.nombre}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                color: "var(--color-muted-foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-destructive)";
                e.currentTarget.style.borderColor = "var(--color-destructive)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-muted-foreground)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}
              >
                <th className="px-5 py-3.5 font-mono">Expediente</th>
                <th className="px-5 py-3.5">Carátula / Cliente</th>
                <th className="px-5 py-3.5">Materia</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Juzgado</th>
                <th className="px-5 py-3.5 hidden lg:table-cell">Responsable</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">Últ. Mov.</th>
                <th className="px-5 py-3.5">Venc.</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Ver</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3.5 rounded shimmer" style={{ width: j === 1 ? "180px" : j === 3 ? "120px" : "70px" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((c) => {
                    const ab = getAbogado(c.abogadoId);
                    const isUrgent = c.proximoVencimiento && c.proximoVencimiento <= today;
                    return (
                      <tr
                        key={c.id}
                        className="table-row-hover"
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                          {c.expediente}
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="font-medium text-[13px] text-foreground truncate">{c.caratula}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {getClienteById(c.clienteId)?.nombre ?? "—"}
                            {" · "}
                            <span className="italic">{c.clienteRol}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${materiaClass[c.materia]}`}>
                            {c.materia}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-muted-foreground max-w-[160px] truncate hidden md:table-cell">
                          {c.juzgado}
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                          {ab?.nombre}
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                          {formatFechaCorta(c.ultimoMovimientoFecha)}
                        </td>
                        <td className="px-5 py-3.5 text-[11px] font-medium whitespace-nowrap">
                          {c.proximoVencimiento ? (
                            <span style={{ color: isUrgent ? "oklch(0.72 0.20 22)" : "var(--color-foreground)" }}>
                              {formatFechaCorta(c.proximoVencimiento)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoClass[c.estado]}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to="/causas/$id"
                            params={{ id: c.id }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                            style={{
                              border: "1px solid var(--color-border)",
                              color: "var(--color-muted-foreground)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--color-primary)";
                              e.currentTarget.style.borderColor = "var(--color-primary)";
                              e.currentTarget.style.background = "oklch(0.62 0.22 282 / 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--color-muted-foreground)";
                              e.currentTarget.style.borderColor = "var(--color-border)";
                              e.currentTarget.style.background = "transparent";
                            }}
                            aria-label="Ver detalle"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Scale className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-[13px] text-muted-foreground">
                        No se encontraron causas con esos criterios.
                      </p>
                      {hasFilters && (
                        <button
                          onClick={clearAll}
                          className="text-[12px] font-medium text-primary hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Registrar Causa ───────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overlay-fade">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FolderPlus className="h-4.5 w-4.5 text-primary" /> Registrar Nueva Causa
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    N° de Expediente
                  </label>
                  <input
                    type="text"
                    required
                    value={expediente}
                    onChange={(e) => setExpediente(e.target.value)}
                    placeholder="Ej. 12.345/2026"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Carátula
                </label>
                <input
                  type="text"
                  required
                  value={caratula}
                  onChange={(e) => setCaratula(e.target.value)}
                  placeholder="Ej. Pérez, Juan c/ Empresa S.A. s/ despido"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Cliente
                  </label>
                  <select
                    required
                    value={fClienteId}
                    onChange={(e) => setFClienteId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    <option value="">Seleccionar cliente…</option>
                    {clientesData.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Rol del Cliente
                  </label>
                  <select
                    value={clienteRol}
                    onChange={(e) => setClienteRol(e.target.value as "Actor" | "Demandado")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    <option value="Actor">Actor</option>
                    <option value="Demandado">Demandado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Materia
                  </label>
                  <select
                    value={fMateria}
                    onChange={(e) => setFMateria(e.target.value as Materia)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    {MATERIAS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Abogado Responsable
                  </label>
                  <select
                    value={fAbogadoId}
                    onChange={(e) => setFAbogadoId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  >
                    {abogados.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Juzgado
                  </label>
                  <input
                    type="text"
                    value={juzgado}
                    onChange={(e) => setJuzgado(e.target.value)}
                    placeholder="Ej. Juzgado Civil N° 24"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 focus:ring-primary/10 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Secretaría
                  </label>
                  <input
                    type="text"
                    value={secretaria}
                    onChange={(e) => setSecretaria(e.target.value)}
                    placeholder="Ej. Secretaría Única"
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
                  disabled={addCausaMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50 touch-target"
                >
                  {addCausaMutation.isPending ? "Registrando..." : "Guardar Causa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
