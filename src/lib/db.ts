import { createClient } from "@supabase/supabase-js";
import {
  causas as initialCausas,
  clientes as initialClientes,
  vencimientos as initialVencimientos,
  tareas as initialTareas,
  abogados as initialAbogados,
  type Causa,
  type Cliente,
  type Vencimiento,
  type Tarea,
  type Abogado,
} from "./mockData";

const isClient = typeof window !== "undefined";

// DATABASE MODE MANAGEMENT (MOCK VS LIVE SUPABASE)
export function isUsingLocalDb(): boolean {
  if (!isClient) return true;
  const val = localStorage.getItem("lexpanel_use_local_db");
  // Default to Supabase (producción) so el estudio entra directo con sus
  // credenciales reales. El modo local queda como opción en Configuración.
  if (val === null) {
    localStorage.setItem("lexpanel_use_local_db", "false");
    return false;
  }
  return val === "true";
}

export function setUsingLocalDb(val: boolean) {
  if (!isClient) return;
  localStorage.setItem("lexpanel_use_local_db", String(val));
}

// MOCK LOCALSTORAGE DATABASE (FALLBACK)
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T) {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
}

const mockDb = {
  getCausas: (): Causa[] => getStorageItem<Causa[]>("lexpanel_causas", initialCausas),
  setCausas: (val: Causa[]) => setStorageItem<Causa[]>("lexpanel_causas", val),

  getClientes: (): Cliente[] => getStorageItem<Cliente[]>("lexpanel_clientes", initialClientes),
  setClientes: (val: Cliente[]) => setStorageItem<Cliente[]>("lexpanel_clientes", val),

  getVencimientos: (): Vencimiento[] => getStorageItem<Vencimiento[]>("lexpanel_vencimientos", initialVencimientos),
  setVencimientos: (val: Vencimiento[]) => setStorageItem<Vencimiento[]>("lexpanel_vencimientos", val),

  getTareas: (): Tarea[] => getStorageItem<Tarea[]>("lexpanel_tareas", initialTareas),
  setTareas: (val: Tarea[]) => setStorageItem<Tarea[]>("lexpanel_tareas", val),

  getAbogados: (): Abogado[] => getStorageItem<Abogado[]>("lexpanel_abogados", initialAbogados),
};

// SUPABASE CONFIGURATION
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Check if credentials are configured correctly (i.e. not empty, not placeholders)
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://tu-proyecto.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "tu-anon-key-aqui";

let supabase: ReturnType<typeof createClient> | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (isClient) {
    console.warn("Supabase credentials not configured in .env. Falling back to localStorage mock db.");
  }
}

// Exported for Supabase Auth (see supabaseAuth.ts). Null when not configured.
export { supabase };

// REAL SUPABASE DATABASE OR MOCK FALLBACK
export const db = {
  getCausas: async (): Promise<Causa[]> => {
    if (isUsingLocalDb() || !supabase) return mockDb.getCausas();
    const { data, error } = await supabase.from("causas").select("*");
    if (error) {
      console.error("Error fetching causas from Supabase:", error);
      return mockDb.getCausas();
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      expediente: c.expediente,
      caratula: c.caratula,
      materia: c.materia,
      juzgado: c.juzgado,
      secretaria: c.secretaria,
      abogadoId: c.abogado_id,
      clienteId: c.cliente_id,
      clienteRol: c.cliente_rol,
      fechaInicio: c.fecha_inicio,
      estado: c.estado,
      ultimoMovimiento: c.ultimo_movimiento,
      ultimoMovimientoFecha: c.ultimo_movimiento_fecha,
      movimientos: c.movimientos || [],
      documentos: c.documentos || [],
      notas: c.notas || [],
    }));
  },

  setCausas: async (val: Causa[]): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setCausas(val);
      return;
    }
    const rows = val.map((c) => ({
      id: c.id,
      expediente: c.expediente,
      caratula: c.caratula,
      materia: c.materia,
      juzgado: c.juzgado,
      secretaria: c.secretaria,
      abogado_id: c.abogadoId,
      cliente_id: c.clienteId,
      cliente_rol: c.clienteRol,
      fecha_inicio: c.fechaInicio,
      estado: c.estado,
      ultimo_movimiento: c.ultimoMovimiento,
      ultimo_movimiento_fecha: c.ultimoMovimientoFecha,
      movimientos: c.movimientos,
      documentos: c.documentos,
      notas: c.notas,
    }));

    const { error } = await (supabase as any).from("causas").upsert(rows as any);
    if (error) console.error("Error saving causas in Supabase:", error);
  },

  deleteCausa: async (id: string): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setCausas(mockDb.getCausas().filter((c) => c.id !== id));
      return;
    }
    const { error } = await supabase.from("causas").delete().eq("id", id);
    if (error) {
      console.error("Error deleting causa in Supabase:", error);
      throw error;
    }
  },

  getClientes: async (): Promise<Cliente[]> => {
    if (isUsingLocalDb() || !supabase) return mockDb.getClientes();
    const { data, error } = await supabase.from("clientes").select("*");
    if (error) {
      console.error("Error fetching clientes from Supabase:", error);
      return mockDb.getClientes();
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      cuit: c.cuit,
      email: c.email,
      telefono: c.telefono,
      direccion: c.direccion,
    }));
  },

  setClientes: async (val: Cliente[]): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setClientes(val);
      return;
    }
    const rows = val.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      cuit: c.cuit,
      email: c.email,
      telefono: c.telefono,
      direccion: c.direccion,
    }));
    const { error } = await (supabase as any).from("clientes").upsert(rows as any);
    if (error) console.error("Error saving clientes in Supabase:", error);
  },

  deleteCliente: async (id: string): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setClientes(mockDb.getClientes().filter((c) => c.id !== id));
      return;
    }
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting cliente in Supabase:", error);
      throw error;
    }
  },

  getVencimientos: async (): Promise<Vencimiento[]> => {
    if (isUsingLocalDb() || !supabase) return mockDb.getVencimientos();
    const { data, error } = await supabase.from("vencimientos").select("*");
    if (error) {
      console.error("Error fetching vencimientos from Supabase:", error);
      return mockDb.getVencimientos();
    }
    return (data || []).map((v: any) => ({
      id: v.id,
      fecha: v.fecha,
      descripcion: v.descripcion,
      causaId: v.causa_id,
      expediente: v.expediente,
      abogadoId: v.abogado_id,
      estado: v.estado,
    }));
  },

  setVencimientos: async (val: Vencimiento[]): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setVencimientos(val);
      return;
    }
    const rows = val.map((v) => ({
      id: v.id,
      fecha: v.fecha,
      descripcion: v.descripcion,
      causa_id: v.causaId,
      expediente: v.expediente,
      abogado_id: v.abogadoId,
      estado: v.estado,
    }));
    const { error } = await (supabase as any).from("vencimientos").upsert(rows as any);
    if (error) console.error("Error saving vencimientos in Supabase:", error);
  },

  deleteVencimiento: async (id: string): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setVencimientos(mockDb.getVencimientos().filter((v) => v.id !== id));
      return;
    }
    const { error } = await supabase.from("vencimientos").delete().eq("id", id);
    if (error) {
      console.error("Error deleting vencimiento in Supabase:", error);
      throw error;
    }
  },

  getTareas: async (): Promise<Tarea[]> => {
    if (isUsingLocalDb() || !supabase) return mockDb.getTareas();
    const { data, error } = await supabase.from("tareas").select("*");
    if (error) {
      console.error("Error fetching tareas from Supabase:", error);
      return mockDb.getTareas();
    }
    return (data || []).map((t: any) => ({
      id: t.id,
      descripcion: t.descripcion,
      causaId: t.causa_id,
      abogadoId: t.abogado_id,
      fechaLimite: t.fecha_limite,
      completada: t.completada,
      prioridad: t.prioridad,
    }));
  },

  setTareas: async (val: Tarea[]): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setTareas(val);
      return;
    }
    const rows = val.map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      causa_id: t.causaId,
      abogado_id: t.abogadoId,
      fecha_limite: t.fechaLimite,
      completada: t.completada,
      prioridad: t.prioridad,
    }));
    const { error } = await (supabase as any).from("tareas").upsert(rows as any);
    if (error) console.error("Error saving tareas in Supabase:", error);
  },

  deleteTarea: async (id: string): Promise<void> => {
    if (isUsingLocalDb() || !supabase) {
      mockDb.setTareas(mockDb.getTareas().filter((t) => t.id !== id));
      return;
    }
    const { error } = await supabase.from("tareas").delete().eq("id", id);
    if (error) {
      console.error("Error deleting tarea in Supabase:", error);
      throw error;
    }
  },

  getAbogados: async (): Promise<Abogado[]> => {
    if (isUsingLocalDb() || !supabase) return mockDb.getAbogados();
    const { data, error } = await supabase.from("abogados").select("*");
    if (error) {
      console.error("Error fetching abogados from Supabase:", error);
      return mockDb.getAbogados();
    }
    return (data || []).map((a: any) => ({
      id: a.id,
      nombre: a.nombre,
      iniciales: a.iniciales,
      especialidades: a.especialidades || [],
    }));
  },
};
