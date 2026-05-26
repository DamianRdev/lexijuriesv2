export type Materia = "Civil" | "Laboral" | "Familia" | "Comercial";
export type EstadoCausa = "Activo" | "Archivado" | "Sentencia";
export type EstadoVencimiento = "Crítico" | "Próximo" | "Cumplido";

export interface Abogado {
  id: string;
  nombre: string;
  iniciales: string;
  especialidades: string[];
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

export interface Causa {
  id: string;
  expediente: string;
  caratula: string;
  materia: Materia;
  juzgado: string;
  secretaria: string;
  abogadoId: string;
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
  { id: "lm", nombre: "Dra. Laura Méndez", iniciales: "LM", especialidades: ["Civil", "Familia"] },
  { id: "ch", nombre: "Dr. Carlos Herrera", iniciales: "CH", especialidades: ["Laboral"] },
  { id: "sa", nombre: "Dra. Sofía Álvarez", iniciales: "SA", especialidades: ["Comercial", "Familia"] },
];

export const causas: Causa[] = [
  {
    id: "1",
    expediente: "12.345/2024",
    caratula: "García, Juan c/ Transportes del Norte S.A. s/ accidente de trabajo",
    materia: "Laboral",
    juzgado: "Juzgado Nacional del Trabajo N° 47",
    secretaria: "Secretaría Única",
    abogadoId: "ch",
    fechaInicio: "2024-03-12",
    estado: "Activo",
    ultimoMovimiento: "Traslado de demanda",
    ultimoMovimientoFecha: "2026-05-26",
    proximoVencimiento: "2026-05-28",
    movimientos: [
      { fecha: "2026-05-26", tipo: "Traslado", descripcion: "Se corre traslado de la demanda por 10 días." },
      { fecha: "2026-05-18", tipo: "Proveído", descripcion: "Se tiene por presentada la demanda y por parte." },
      { fecha: "2026-05-10", tipo: "Cargo", descripcion: "Se carga escrito de demanda y documental." },
      { fecha: "2026-04-22", tipo: "Resolución", descripcion: "Se admite la prueba pericial médica." },
      { fecha: "2026-04-05", tipo: "Audiencia", descripcion: "Audiencia preliminar art. 360 CPCCN." },
    ],
    documentos: [
      { id: "d1", nombre: "Demanda.pdf", fecha: "2026-05-10", tipo: "Escrito" },
      { id: "d2", nombre: "Recibos de sueldo.pdf", fecha: "2026-05-10", tipo: "Documental" },
      { id: "d3", nombre: "Pericia médica.pdf", fecha: "2026-04-22", tipo: "Pericia" },
    ],
    notas: [
      { id: "n1", autor: "Dr. Carlos Herrera", fecha: "2026-05-20", texto: "Cliente confirma disponibilidad para audiencia." },
    ],
  },
  {
    id: "2",
    expediente: "8.901/2025",
    caratula: "Rodríguez, María c/ Obra Social OSDE s/ amparo de salud",
    materia: "Civil",
    juzgado: "Juzgado Civil y Comercial Federal N° 3",
    secretaria: "Secretaría N° 6",
    abogadoId: "lm",
    fechaInicio: "2025-01-20",
    estado: "Activo",
    ultimoMovimiento: "Sentencia de primera instancia",
    ultimoMovimientoFecha: "2026-05-25",
    proximoVencimiento: "2026-05-27",
    movimientos: [
      { fecha: "2026-05-25", tipo: "Sentencia", descripcion: "Se hace lugar al amparo. Cobertura 100%." },
      { fecha: "2026-05-15", tipo: "Alegato", descripcion: "Se presentan alegatos de la actora." },
      { fecha: "2026-04-30", tipo: "Audiencia", descripcion: "Audiencia de vista de causa." },
      { fecha: "2026-04-10", tipo: "Pericia", descripcion: "Se incorpora pericia médica." },
      { fecha: "2026-03-15", tipo: "Cautelar", descripcion: "Se dicta medida cautelar innovativa." },
    ],
    documentos: [
      { id: "d1", nombre: "Amparo.pdf", fecha: "2025-01-20", tipo: "Escrito" },
      { id: "d2", nombre: "Historia clínica.pdf", fecha: "2025-01-20", tipo: "Documental" },
    ],
    notas: [],
  },
  {
    id: "3",
    expediente: "4.567/2024",
    caratula: "Fernández, Pablo c/ Constructora del Sur S.R.L. s/ daños y perjuicios",
    materia: "Civil",
    juzgado: "Juzgado Civil N° 24",
    secretaria: "Secretaría Única",
    abogadoId: "lm",
    fechaInicio: "2024-07-08",
    estado: "Activo",
    ultimoMovimiento: "Apertura a prueba",
    ultimoMovimientoFecha: "2026-05-24",
    proximoVencimiento: "2026-06-10",
    movimientos: [
      { fecha: "2026-05-24", tipo: "Resolución", descripcion: "Se abre la causa a prueba por 40 días." },
      { fecha: "2026-05-12", tipo: "Contestación", descripcion: "Se contesta demanda." },
      { fecha: "2026-04-28", tipo: "Traslado", descripcion: "Se notifica traslado de demanda." },
      { fecha: "2026-03-20", tipo: "Cargo", descripcion: "Se presenta demanda por daños materiales." },
      { fecha: "2026-02-15", tipo: "Mediación", descripcion: "Mediación previa obligatoria sin acuerdo." },
    ],
    documentos: [
      { id: "d1", nombre: "Demanda daños.pdf", fecha: "2026-03-20", tipo: "Escrito" },
    ],
    notas: [],
  },
  {
    id: "4",
    expediente: "15.220/2025",
    caratula: "Acosta, Lucía s/ divorcio vincular",
    materia: "Familia",
    juzgado: "Juzgado de Familia N° 5",
    secretaria: "Secretaría Única",
    abogadoId: "sa",
    fechaInicio: "2025-09-14",
    estado: "Activo",
    ultimoMovimiento: "Convenio regulador presentado",
    ultimoMovimientoFecha: "2026-05-22",
    proximoVencimiento: "2026-06-02",
    movimientos: [
      { fecha: "2026-05-22", tipo: "Escrito", descripcion: "Se acompaña convenio regulador firmado." },
      { fecha: "2026-05-05", tipo: "Audiencia", descripcion: "Audiencia de conciliación." },
      { fecha: "2026-03-10", tipo: "Proveído", descripcion: "Se cita a las partes a audiencia." },
      { fecha: "2025-12-01", tipo: "Cargo", descripcion: "Presentación de demanda de divorcio." },
      { fecha: "2025-09-14", tipo: "Inicio", descripcion: "Apertura del expediente." },
    ],
    documentos: [],
    notas: [],
  },
  {
    id: "5",
    expediente: "2.118/2026",
    caratula: "Distribuidora Andina S.A. c/ Mayorista Cuyo S.R.L. s/ ejecutivo",
    materia: "Comercial",
    juzgado: "Juzgado Comercial N° 12",
    secretaria: "Secretaría N° 24",
    abogadoId: "sa",
    fechaInicio: "2026-02-04",
    estado: "Activo",
    ultimoMovimiento: "Intimación de pago",
    ultimoMovimientoFecha: "2026-05-26",
    proximoVencimiento: "2026-06-05",
    movimientos: [
      { fecha: "2026-05-26", tipo: "Mandamiento", descripcion: "Se libra mandamiento de intimación de pago." },
      { fecha: "2026-05-10", tipo: "Resolución", descripcion: "Se decreta la apertura del juicio ejecutivo." },
      { fecha: "2026-04-18", tipo: "Cargo", descripcion: "Se presenta demanda ejecutiva con pagarés." },
      { fecha: "2026-03-02", tipo: "Mediación", descripcion: "Mediación finalizada sin acuerdo." },
      { fecha: "2026-02-04", tipo: "Inicio", descripcion: "Apertura del expediente." },
    ],
    documentos: [
      { id: "d1", nombre: "Pagarés.pdf", fecha: "2026-04-18", tipo: "Documental" },
    ],
    notas: [],
  },
  {
    id: "6",
    expediente: "9.812/2023",
    caratula: "Sánchez, Roberto c/ ANSES s/ reajustes varios",
    materia: "Laboral",
    juzgado: "Juzgado Federal de la Seguridad Social N° 8",
    secretaria: "Secretaría Única",
    abogadoId: "ch",
    fechaInicio: "2023-11-22",
    estado: "Sentencia",
    ultimoMovimiento: "Sentencia firme",
    ultimoMovimientoFecha: "2026-05-15",
    movimientos: [
      { fecha: "2026-05-15", tipo: "Sentencia", descripcion: "Sentencia confirmada por Cámara." },
      { fecha: "2026-04-02", tipo: "Recurso", descripcion: "Se contesta recurso de ANSES." },
      { fecha: "2026-02-20", tipo: "Sentencia", descripcion: "Sentencia de primera instancia favorable." },
      { fecha: "2025-11-10", tipo: "Audiencia", descripcion: "Audiencia de vista de causa." },
      { fecha: "2024-08-05", tipo: "Pericia", descripcion: "Pericia contable incorporada." },
    ],
    documentos: [],
    notas: [],
  },
  {
    id: "7",
    expediente: "6.345/2025",
    caratula: "López, Verónica c/ López, Andrés s/ alimentos",
    materia: "Familia",
    juzgado: "Juzgado de Familia N° 2",
    secretaria: "Secretaría Única",
    abogadoId: "lm",
    fechaInicio: "2025-04-18",
    estado: "Activo",
    ultimoMovimiento: "Audiencia fijada",
    ultimoMovimientoFecha: "2026-05-23",
    proximoVencimiento: "2026-06-12",
    movimientos: [
      { fecha: "2026-05-23", tipo: "Proveído", descripcion: "Se fija audiencia para el 12/06/2026." },
      { fecha: "2026-05-08", tipo: "Escrito", descripcion: "Se solicita aumento de cuota alimentaria." },
      { fecha: "2026-03-15", tipo: "Resolución", descripcion: "Se homologa cuota provisoria." },
      { fecha: "2025-06-30", tipo: "Audiencia", descripcion: "Audiencia preliminar." },
      { fecha: "2025-04-18", tipo: "Inicio", descripcion: "Apertura del expediente." },
    ],
    documentos: [],
    notas: [],
  },
  {
    id: "8",
    expediente: "3.992/2024",
    caratula: "Inmobiliaria Patagonia S.A. c/ Gómez, Esteban s/ desalojo",
    materia: "Civil",
    juzgado: "Juzgado Civil N° 31",
    secretaria: "Secretaría Única",
    abogadoId: "sa",
    fechaInicio: "2024-10-02",
    estado: "Archivado",
    ultimoMovimiento: "Archivo del expediente",
    ultimoMovimientoFecha: "2026-04-10",
    movimientos: [
      { fecha: "2026-04-10", tipo: "Archivo", descripcion: "Se ordena el archivo por cumplimiento." },
      { fecha: "2026-03-01", tipo: "Acuerdo", descripcion: "Se homologa acuerdo de desocupación." },
      { fecha: "2025-12-15", tipo: "Audiencia", descripcion: "Audiencia de conciliación." },
      { fecha: "2025-08-20", tipo: "Contestación", descripcion: "Demandado contesta demanda." },
      { fecha: "2024-10-02", tipo: "Inicio", descripcion: "Apertura del expediente." },
    ],
    documentos: [],
    notas: [],
  },
];

export const vencimientos: Vencimiento[] = [
  { id: "v1", fecha: "2026-05-27", descripcion: "Contestar traslado de sentencia", causaId: "2", expediente: "8.901/2025", abogadoId: "lm", estado: "Crítico" },
  { id: "v2", fecha: "2026-05-28", descripcion: "Vencimiento traslado de demanda", causaId: "1", expediente: "12.345/2024", abogadoId: "ch", estado: "Crítico" },
  { id: "v3", fecha: "2026-05-29", descripcion: "Presentar prueba documental", causaId: "3", expediente: "4.567/2024", abogadoId: "lm", estado: "Crítico" },
  { id: "v4", fecha: "2026-06-02", descripcion: "Audiencia homologación convenio", causaId: "4", expediente: "15.220/2025", abogadoId: "sa", estado: "Próximo" },
  { id: "v5", fecha: "2026-06-05", descripcion: "Oponer excepciones", causaId: "5", expediente: "2.118/2026", abogadoId: "sa", estado: "Próximo" },
  { id: "v6", fecha: "2026-06-10", descripcion: "Ofrecimiento de prueba", causaId: "3", expediente: "4.567/2024", abogadoId: "lm", estado: "Próximo" },
  { id: "v7", fecha: "2026-06-12", descripcion: "Audiencia art. 639 CCCN", causaId: "7", expediente: "6.345/2025", abogadoId: "lm", estado: "Próximo" },
  { id: "v8", fecha: "2026-06-18", descripcion: "Pericia contable a realizarse", causaId: "5", expediente: "2.118/2026", abogadoId: "sa", estado: "Próximo" },
  { id: "v9", fecha: "2026-05-20", descripcion: "Entrega de documentación al perito", causaId: "1", expediente: "12.345/2024", abogadoId: "ch", estado: "Cumplido" },
  { id: "v10", fecha: "2026-05-15", descripcion: "Presentación de alegatos", causaId: "2", expediente: "8.901/2025", abogadoId: "lm", estado: "Cumplido" },
];

export function getAbogado(id: string) {
  return abogados.find((a) => a.id === id);
}

export function getCausa(id: string) {
  return causas.find((c) => c.id === id);
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
