const AUDIT_KEY = "lexpanel_audit";
const MAX_ENTRIES = 200;

export type AuditAction =
  | "login" | "logout" | "session_expired" | "session_refreshed"
  | "view_causa" | "create_causa" | "update_causa"
  | "create_cliente" | "create_tarea" | "update_tarea"
  | "create_nota" | "download_doc"
  | "rbac_denied"
  | "2fa_required" | "2fa_success" | "2fa_failed";

export interface AuditEntry {
  id: string;
  ts: number;         // timestamp ms
  action: AuditAction;
  user: string;       // email
  role: string;
  details?: string;
}

function load(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(entries: AuditEntry[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export const audit = {
  log(action: AuditAction, user: string, role: string, details?: string): void {
    const entries = load();
    entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: Date.now(),
      action,
      user,
      role,
      details,
    });
    save(entries);
  },

  getAll(): AuditEntry[] {
    return load();
  },

  clear(): void {
    localStorage.removeItem(AUDIT_KEY);
  },

  formatTs(ts: number): string {
    return new Date(ts).toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  },
};
