import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/configuracion")({
  component: ConfiguracionPage,
  head: () => ({ meta: [{ title: "Configuración — LexPanel" }] }),
});

function ConfiguracionPage() {
  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px] mx-auto">
      <h1 className="font-serif text-4xl text-foreground tracking-tight mb-1">Configuración</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Preferencias generales del estudio
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        <Card title="Datos del estudio">
          <Row label="Razón social" value="Méndez, Herrera & Álvarez Abogados" />
          <Row label="CUIT" value="30-71234567-8" />
          <Row label="Domicilio" value="Av. Corrientes 1234, Piso 8°, CABA" />
          <Row label="Matrícula" value="CPACF T° 123 F° 456" />
        </Card>

        <Card title="Integraciones">
          <Row label="Portal PJN" value="Conectado" />
          <Row label="MEV SCBA" value="Conectado" />
          <Row label="AFIP" value="No conectado" />
          <Row label="Google Calendar" value="Conectado" />
        </Card>

        <Card title="Facturación">
          <Row label="Plan" value="Estudio Profesional" />
          <Row label="Usuarios" value="3 / 5" />
          <Row label="Próximo cobro" value="01/06/2026" />
        </Card>

        <Card title="Seguridad">
          <Row label="Autenticación en 2 pasos" value="Activada" />
          <Row label="Última sesión" value="26/05/2026 09:14" />
        </Card>
      </div>

      <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
        <SettingsIcon className="h-3.5 w-3.5" />
        LexPanel v1.0 · Última sincronización 26/05/2026 14:32
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground mb-4">{title}</h2>
      <dl className="space-y-2.5 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  );
}
