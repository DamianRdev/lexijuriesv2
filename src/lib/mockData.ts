export const MATERIAS_BASE = ["Civil", "Laboral", "Familia", "Comercial"] as const;
// Open union: the 4 standard materias keep autocomplete, but custom ones are valid too.
export type Materia = (typeof MATERIAS_BASE)[number] | (string & {});
export type EstadoCausa = "Activo" | "Archivado" | "Sentencia";
export type EstadoVencimiento = "Crítico" | "Próximo" | "Cumplido";

export interface Abogado {
  id: string;
  nombre: string;
  iniciales: string;
  especialidades: string[];
  role?: "Socio" | "Asociado";
}

export interface Movimiento {
  fecha: string;
  tipo: string;
  descripcion: string;
}

export interface Vencimiento {
  id: string;
  fecha: string; // ISO
  descripcion: string;
  causaId: string;
  expediente: string;
  abogadoId: string;
  estado: EstadoVencimiento;
}

export interface Documento {
  id: string;
  nombre: string;
  fecha: string;
  tipo: string;
}

export interface Nota {
  id: string;
  autor: string;
  fecha: string;
  texto: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: "Física" | "Jurídica";
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface Tarea {
  id: string;
  descripcion: string;
  causaId: string;
  abogadoId: string;
  fechaLimite: string;
  completada: boolean;
  prioridad: "Alta" | "Media" | "Baja";
}

export interface Causa {
  id: string;
  expediente: string;
  caratula: string;
  materia: Materia;
  juzgado: string;
  secretaria: string;
  abogadoId: string;
  clienteId: string; // Enlace al cliente
  clienteRol: "Actor" | "Demandado"; // Rol del cliente
  fechaInicio: string;
  estado: EstadoCausa;
  ultimoMovimiento: string;
  ultimoMovimientoFecha: string;
  proximoVencimiento?: string;
  movimientos: Movimiento[];
  documentos: Documento[];
  notas: Nota[];
}

export const abogados: Abogado[] = [
  { id: "mtp", nombre: "Dr. Miguel Angel Tejera (P)", iniciales: "MT", especialidades: [], role: "Socio" },
  { id: "mth", nombre: "Dr. Miguel Angel Tejera (H)", iniciales: "MT", especialidades: [], role: "Socio" },
  { id: "ah", nombre: "Dra. Analia Heredia", iniciales: "AH", especialidades: [], role: "Asociado" },
];

export const clientes: Cliente[] = [];

export const causas: Causa[] = [];

export const vencimientos: Vencimiento[] = [];

export const tareas: Tarea[] = [];

export function getAbogado(id: string) {
  return abogados.find((a) => a.id === id);
}

export function getCausa(id: string) {
  return causas.find((c) => c.id === id);
}

export function getCliente(id: string) {
  return clientes.find((cl) => cl.id === id);
}

export function getTareasForCausa(causaId: string) {
  return tareas.filter((t) => t.causaId === causaId);
}

export const materiaColor: Record<Materia, string> = {
  Civil: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Laboral: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Familia: "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  Comercial: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};

export function formatFechaCorta(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatFechaLarga(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
