// Real authentication via Supabase Auth.
// Isolated from the mock auth flow (auth.ts) — used only when NOT in local DB mode.
// login.tsx decides which path to take based on isUsingLocalDb().

import { supabase } from "@/lib/db";
import type { UserSession } from "@/lib/auth";

export type SupabaseSignInResult =
  | { ok: true; user: UserSession }
  | { ok: false; error: string };

// Sign in with email + password against Supabase Auth, then load the
// matching profile row to resolve role + abogadoId. RLS filters the rest.
export async function signInWithSupabase(
  email: string,
  password: string,
): Promise<SupabaseSignInResult> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Map common Supabase errors to friendly Spanish messages.
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login")) return { ok: false, error: "Credenciales incorrectas." };
    if (msg.includes("email not confirmed"))
      return { ok: false, error: "El email no está confirmado. Contactá al administrador." };
    return { ok: false, error: error.message };
  }

  if (!data.user) return { ok: false, error: "No se pudo iniciar sesión." };

  // Load the profile (maps auth user → abogado + role).
  // The Supabase client isn't typed with our DB schema, so cast the row.
  const { data: profileData, error: pErr } = await supabase
    .from("profiles")
    .select("email, abogado_id, role, nombre, iniciales")
    .eq("id", data.user.id)
    .single();

  const profile = profileData as {
    email: string;
    abogado_id: string;
    role: string;
    nombre: string;
    iniciales: string;
  } | null;

  if (pErr || !profile) {
    return { ok: false, error: "El usuario no tiene un perfil asignado en el sistema." };
  }

  const user: UserSession = {
    email: profile.email,
    nombre: profile.nombre,
    role: profile.role === "socio" ? "Socio" : "Asociado",
    iniciales: profile.iniciales,
    abogadoId: profile.abogado_id,
  };

  return { ok: true, user };
}

// Change the current user's password. Requires an active Supabase session
// (i.e. logged in via Supabase Auth, not mock mode). RLS/Auth verifies the session.
export async function changePassword(
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("at least") || msg.includes("weak") || msg.includes("password"))
      return { ok: false, error: "La contraseña es demasiado débil (mínimo 6 caracteres)." };
    if (msg.includes("session") || msg.includes("not authenticated") || msg.includes("jwt"))
      return { ok: false, error: "Tu sesión expiró. Cerrá sesión y volvé a entrar." };
    if (msg.includes("same"))
      return { ok: false, error: "La nueva contraseña no puede ser igual a la actual." };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// Clear the Supabase session (used on logout). Safe to call when not configured.
export async function signOutSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore — local session is already cleared by the caller.
  }
}
