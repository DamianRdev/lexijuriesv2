// User preferences persisted in localStorage.
// Centralizes app-wide settings so the Configuración page controls real behavior.

export type ThemeMode = "light" | "dark" | "system";
export type TableDensity = "compact" | "normal";

export interface Prefs {
  theme: ThemeMode;
  tableDensity: TableDensity;
  emailNotif: boolean;
  pushNotif: boolean;
  vencimientoAlert: boolean;
  movimientoAlert: boolean;
  resumenSemanal: boolean;
  showArchived: boolean;
  autoRefresh: boolean;
}

const DEFAULTS: Prefs = {
  theme: "dark",
  tableDensity: "normal",
  emailNotif: true,
  pushNotif: true,
  vencimientoAlert: true,
  movimientoAlert: false,
  resumenSemanal: true,
  showArchived: true,
  autoRefresh: false,
};

const STORAGE_KEY = "lexpanel_prefs";
const isClient = typeof window !== "undefined";

type Listener = (prefs: Prefs) => void;
const listeners = new Set<Listener>();

function read(): Prefs {
  if (!isClient) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(prefs: Prefs) {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  listeners.forEach((l) => l(prefs));
}

export const prefs = {
  getAll: read,

  get<K extends keyof Prefs>(key: K): Prefs[K] {
    return read()[key];
  },

  set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const next = { ...read(), [key]: value };
    write(next);
    if (key === "theme") applyTheme(value as ThemeMode);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// ─── THEME APPLICATION ──────────────────────────────
// Dark is the default (:root). Light is opt-in via the `.light` class on <html>.

let systemMql: MediaQueryList | null = null;

function setLightClass(on: boolean) {
  if (!isClient) return;
  document.documentElement.classList.toggle("light", on);
}

function handleSystemChange(e: MediaQueryListEvent) {
  setLightClass(e.matches);
}

export function applyTheme(theme: ThemeMode) {
  if (!isClient) return;

  // Detach any previous system listener first.
  if (systemMql) {
    systemMql.removeEventListener("change", handleSystemChange);
    systemMql = null;
  }

  if (theme === "light") {
    setLightClass(true);
  } else if (theme === "dark") {
    setLightClass(false);
  } else {
    // system
    systemMql = window.matchMedia("(prefers-color-scheme: light)");
    setLightClass(systemMql.matches);
    systemMql.addEventListener("change", handleSystemChange);
  }
}

// Apply the persisted theme as early as possible on the client.
export function initTheme() {
  if (!isClient) return;
  applyTheme(read().theme);
}
