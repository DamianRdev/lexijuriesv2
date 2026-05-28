import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { abogados, causas, vencimientos } from "@/lib/mockData";
import { ToggleRow } from "@/components/ToggleRow";

export const Route = createFileRoute("/equipo")({
  component: EquipoPage,
  head: () => ({ meta: [{ title: "Equipo — LexPanel" }] }),
});

function EquipoPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [waAlerts, setWaAlerts] = useState(false);

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <h1 className="font-serif text-4xl text-foreground tracking-tight mb-1">Equipo</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Abogados del estudio y preferencias de notificación
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {abogados.map((a) => {
          const activas = causas.filter(
            (c) => c.abogadoId === a.id && c.estado === "Activo",
          ).length;
          const venc = vencimientos.filter(
            (v) => v.abogadoId === a.id && v.estado !== "Cumplido",
          ).length;
          return (
            <div key={a.id} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                  {a.iniciales}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.especialidades.join(" · ")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Causas activas
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-1">{activas}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Vencimientos
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-1">{venc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-2xl">
        <h2 className="text-base font-semibold text-foreground mb-1">Notificaciones</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Configurá cómo querés recibir los avisos de vencimientos.
        </p>

        <ToggleRow
          icon={<Mail className="h-4 w-4" />}
          label="Alertas por Email"
          description="Recibir resumen diario y avisos críticos por correo."
          checked={emailAlerts}
          onChange={setEmailAlerts}
        />
        <ToggleRow
          icon={<MessageCircle className="h-4 w-4" />}
          label="Alertas por WhatsApp"
          description="Avisos inmediatos al móvil para vencimientos críticos."
          checked={waAlerts}
          onChange={setWaAlerts}
        />
      </div>
    </div>
  );
}
