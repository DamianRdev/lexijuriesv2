import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Scale, Mail, Lock, ShieldAlert, ArrowRight, ShieldCheck, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Iniciar Sesión — LexPanel" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const user = auth.login(email, password);
      setIsLoading(false);
      if (user) {
        toast.success(`Bienvenido de nuevo, ${user.nombre}.`);
        navigate({ to: "/" });
      } else {
        setError("Credenciales incorrectas. Verifique el correo y la contraseña.");
        toast.error("Error al iniciar sesión.");
      }
    }, 800); // Small delay to simulate auth network request
  };

  const autofillUser = (role: "Socio" | "Asociado") => {
    if (role === "Socio") {
      setEmail("laura@lexpanel.com");
      setPassword("laura");
    } else {
      setEmail("carlos@lexpanel.com");
      setPassword("carlos");
    }
    setError("");
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0D6E75]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-950/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Scale className="h-6 w-6 text-[#0D6E75]" />
          </div>
          <h2 className="font-serif text-3xl text-white tracking-tight">LexPanel</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
            Portal de Acceso Profesional
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-950/50 border border-red-800/80 rounded-md p-3.5 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200 leading-normal">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abogado@lexpanel.com"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D6E75] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D6E75] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0D6E75] hover:bg-[#0c5c62] text-white py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-950/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            ) : (
              <>
                Ingresar al Sistema <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login (Autofill Buttons) */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Accesos Rápidos de Prueba
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => autofillUser("Socio")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0D6E75]" /> Laura Méndez
              </div>
              <span className="text-[9px] text-slate-400">Rol: Socia (Partner)</span>
            </button>
            <button
              onClick={() => autofillUser("Asociado")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <User className="h-3.5 w-3.5 text-indigo-400" /> Carlos Herrera
              </div>
              <span className="text-[9px] text-slate-400">Rol: Asociado (Associate)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
