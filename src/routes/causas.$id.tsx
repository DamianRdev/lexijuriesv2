import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  Download,
  Inbox,
  CalendarDays,
  StickyNote,
} from "lucide-react";
import {
  getCausa,
  getAbogado,
  vencimientos as allVenc,
  materiaColor,
  formatFechaCorta,
  type EstadoVencimiento,
} from "@/lib/mockData";

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
  const causa = getCausa(id);
  const [tab, setTab] = useState<"docs" | "venc" | "notas">("docs");
  const [nuevaNota, setNuevaNota] = useState("");

  if (!causa) throw notFound();
  const abogado = getAbogado(causa.abogadoId);
  const vencs = allVenc.filter((v) => v.causaId === causa.id);

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <Link to="/causas" className="hover:text-foreground">Causas</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[60ch]">{causa.caratula}</span>
      </nav>

      <div className="flex items-center gap-3 mb-1">
        <span className="font-mono text-xs text-muted-foreground">Exp. {causa.expediente}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${materiaColor[causa.materia]}`}>
          {causa.materia}
        </span>
      </div>
      <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight mb-8">
        {causa.caratula}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* LEFT: metadata */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Información de la causa</h2>
          <dl className="space-y-3 text-sm">
            <Field label="Expediente" value={causa.expediente} />
            <Field label="Carátula" value={causa.caratula} />
            <Field label="Juzgado" value={causa.juzgado} />
            <Field label="Secretaría" value={causa.secretaria} />
            <Field label="Materia" value={causa.materia} />
            <Field label="Abogado responsable" value={abogado?.nombre ?? "—"} />
            <Field label="Fecha de inicio" value={formatFechaCorta(causa.fechaInicio)} />
            <Field label="Estado" value={causa.estado} />
          </dl>
        </div>

        {/* RIGHT: timeline */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-5">Últimos movimientos</h2>
          <ol className="relative border-l-2 border-border ml-2 space-y-5">
            {causa.movimientos.map((m, i) => (
              <li key={i} className="pl-5 relative">
                <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{m.tipo}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatFechaCorta(m.fecha)}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{m.descripcion}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex border-b border-border">
          <TabBtn active={tab === "docs"} onClick={() => setTab("docs")}>Documentos</TabBtn>
          <TabBtn active={tab === "venc"} onClick={() => setTab("venc")}>Vencimientos</TabBtn>
          <TabBtn active={tab === "notas"} onClick={() => setTab("notas")}>Notas</TabBtn>
        </div>

        <div className="p-5">
          {tab === "docs" && (
            causa.documentos.length === 0 ? (
              <EmptyState icon={Inbox} text="No hay documentos cargados en esta causa." />
            ) : (
              <ul className="divide-y divide-border">
                {causa.documentos.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.nombre}</p>
                      <p className="text-xs text-muted-foreground">{d.tipo} · {formatFechaCorta(d.fecha)}</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <Download className="h-3.5 w-3.5" /> Descargar
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "venc" && (
            vencs.length === 0 ? (
              <EmptyState icon={CalendarDays} text="No hay vencimientos asociados." />
            ) : (
              <ul className="divide-y divide-border">
                {vencs.map((v) => (
                  <li key={v.id} className="flex items-center gap-4 py-3">
                    <div className="text-center w-16 shrink-0">
                      <p className="text-xs text-muted-foreground uppercase">
                        {new Date(v.fecha + "T00:00:00").toLocaleDateString("es-AR", { month: "short" })}
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {new Date(v.fecha + "T00:00:00").getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{v.descripcion}</p>
                      <p className="text-xs text-muted-foreground">{formatFechaCorta(v.fecha)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${vencBadge[v.estado]}`}>
                      {v.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "notas" && (
            <div className="space-y-4">
              <div>
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  rows={3}
                  placeholder="Escribir una nota interna…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    Guardar nota
                  </button>
                </div>
              </div>
              {causa.notas.length === 0 ? (
                <EmptyState icon={StickyNote} text="Aún no hay notas en esta causa." />
              ) : (
                <ul className="space-y-3">
                  {causa.notas.map((n) => (
                    <li key={n.id} className="rounded-md border border-border p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-foreground">{n.autor}</p>
                        <p className="text-xs text-muted-foreground">{formatFechaCorta(n.fecha)}</p>
                      </div>
                      <p className="text-sm text-foreground">{n.texto}</p>
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
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-xs text-muted-foreground col-span-1 uppercase tracking-wide">{label}</dt>
      <dd className="col-span-2 text-foreground">{value}</dd>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
