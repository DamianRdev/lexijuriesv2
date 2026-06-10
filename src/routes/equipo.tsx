import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, FolderOpen, CalendarClock, ChevronRight } from "lucide-react";
import { abogados } from "@/lib/mockData";
import { ToggleRow } from "@/components/ToggleRow";
import { useCausas, useVencimientos } from "@/hooks/useDb";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/equipo")({
  component: EquipoPage,
  head: () => ({ meta: [{ title: "Equipo — LexPanel" }] }),
});

const roleStyle: Record<string, React.CSSProperties> = {
  Socio:    { background: "oklch(0.17 0.05 282)", color: "oklch(0.65 0.18 282)", boxShadow: "0 0 0 1px oklch(0.65 0.18 282 / 0.2)" },
  Asociado: { background: "oklch(0.17 0.06 240)", color: "oklch(0.70 0.14 240)", boxShadow: "0 0 0 1px oklch(0.70 0.14 240 / 0.2)" },
};

const avatarGrad = [
  "oklch(0.62 0.22 282)",
  "oklch(0.65 0.18 240)",
  "oklch(0.70 0.17 165)",
];

function EquipoPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [waAlerts, setWaAlerts] = useState(false);

  const { data: causasData = [], isLoading: isLoadingCausas } = useCausas();
  const { data: vencimientosData = [], isLoading: isLoadingVencs } = useVencimientos();

  const isLoading = isLoadingCausas || isLoadingVencs;

  const maxCausas = Math.max(
    1,
    ...abogados.map((a) => causasData.filter((c) => c.abogadoId === a.id).length)
  );

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
          Equipo del Estudio
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Abogados y distribución de carga procesal
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {abogados.map((a, idx) => {
            const activas = causasData.filter((c) => c.abogadoId === a.id && c.estado === "Activo").length;
            const total   = causasData.filter((c) => c.abogadoId === a.id).length;
            const vencPend = vencimientosData.filter((v) => v.abogadoId === a.id && v.estado !== "Cumplido").length;
            const vencCrit = vencimientosData.filter((v) => v.abogadoId === a.id && v.estado === "Crítico").length;
            const color = avatarGrad[idx % avatarGrad.length];
            const role = idx === 0 ? "Socio" : "Asociado";
            const pct = Math.round((activas / maxCausas) * 100);

            return (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card shadow-sm card-hover relative overflow-hidden flex flex-col"
              >
                {/* Top accent line colored by index */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color} 40%, transparent)` }} />

                {/* Avatar + name */}
                <div className="p-5 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ring-1"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color}, oklch(0.085 0.016 275))`,
                      ringColor: `${color}40`,
                      boxShadow: `0 0 16px ${color}30`,
                    }}
                  >
                    {a.iniciales}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate text-sm">{a.nombre}</p>
                      <span
                        className="text-[9px] font-bold px-1.5 py-px rounded"
                        style={roleStyle[role]}
                      >
                        {role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {a.especialidades.map((esp) => (
                        <span key={esp}
                          className="text-[9px] font-semibold px-1.5 py-px rounded"
                          style={{ background: "oklch(0.155 0.016 275)", color: "oklch(0.55 0.022 278)" }}>
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border mx-5" />

                {/* Stats */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
                      <FolderOpen className="h-3 w-3" /> Causas activas
                    </div>
                    <p className="text-2xl font-bold text-foreground">{activas}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{total} en total</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
                      <CalendarClock className="h-3 w-3" /> Vencimientos
                    </div>
                    <p className="text-2xl font-bold text-foreground">{vencPend}</p>
                    {vencCrit > 0 && (
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: "oklch(0.72 0.20 22)" }}>
                        {vencCrit} crítico{vencCrit > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Workload bar */}
                <div className="px-5 pb-5">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Carga procesal</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "oklch(0.155 0.016 275)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notificaciones */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm max-w-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 282 / 0.5), transparent)" }} />
        <h2 className="text-sm font-semibold text-foreground mb-0.5">Notificaciones del equipo</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Configurá cómo recibir avisos de vencimientos y novedades judiciales.
        </p>
        <div className="space-y-1">
          <ToggleRow
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label="Alertas por Email"
            description="Resumen diario y avisos críticos por correo."
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <ToggleRow
            icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
            label="Alertas por WhatsApp"
            description="Avisos inmediatos al móvil para vencimientos críticos."
            checked={waAlerts}
            onChange={setWaAlerts}
          />
        </div>
      </div>
    </div>
  );
}
