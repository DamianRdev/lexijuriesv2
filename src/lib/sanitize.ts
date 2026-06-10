// Escapa caracteres HTML para prevenir XSS en outputs dinámicos
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Limpia input de texto: elimina tags HTML y normaliza espacios
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")          // strip HTML tags
    .replace(/[<>'"]/g, "")           // strip remaining dangerous chars
    .replace(/\s{3,}/g, "  ")         // collapse excessive whitespace
    .trim();
}

// Valida CUIT/CUIL argentino (formato XX-XXXXXXXX-X)
export function validateCuit(cuit: string): boolean {
  const cleaned = cuit.replace(/[-\s]/g, "");
  if (!/^\d{11}$/.test(cleaned)) return false;
  const [prefix] = [cleaned.slice(0, 2)];
  const validPrefixes = ["20","23","24","27","30","33","34"];
  return validPrefixes.includes(prefix);
}

// Sanitiza y valida un objeto de formulario — retorna campos limpios
export function sanitizeFormData<T extends Record<string, string>>(data: T): T {
  const result = {} as T;
  for (const key in data) {
    result[key] = sanitizeText(data[key]) as T[typeof key];
  }
  return result;
}
