import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

interface LoginProps {
  onSuccess: (role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, error, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setSubmitting(true);
    const success = await login(password);
    setSubmitting(false);

    if (success) {
      // Obtener el rol del usuario autenticado de forma segura tras el login
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        onSuccess(data.role);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A467A] via-[#083c6b] to-[#062a4d]">
      
      {/* Luces y círculos de fondo difuminados y futuristas */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#06b6d4]/10 blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#FF8200]/10 blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Grid de Fondo */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        
         {/* Encabezado Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/assets/tee.png" 
            alt="Tribunal Electoral Estudiantil Calasanz 2026" 
            className="h-20 w-auto object-contain animate-float drop-shadow-[0_4px_10px_rgba(255,255,255,0.15)]" 
          />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white font-display text-center uppercase leading-tight text-glow-cyan">
            Tribunal Electoral Estudiantil Calasanz 2026
          </h1>
        </div>

        {/* Panel Formulario */}
        <div className="glass-panel p-8 rounded-3xl shadow-xl border-white/80 relative overflow-hidden">
          
          {/* Línea brillante arriba */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#06b6d4]/40 to-transparent" />

          {/* Cabecera Interna de Tarjeta con Escudo Calasanz */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200/50">
            <img 
              src="/assets/logocala.jpg" 
              alt="Calasanz Escudo" 
              className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-sm"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Pasarela de Acceso</h2>
              <p className="text-xs text-slate-500 font-medium">Terminal Oficial Autorizada</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#0891b2] uppercase tracking-wider mb-2">
                Contraseña de Seguridad
              </label>
              
              <div className="relative rounded-xl overflow-hidden bg-white/70 border border-slate-200 focus-within:border-[#06b6d4]/50 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.08)] focus-within:bg-white transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  className="block w-full pl-10 pr-12 py-3.5 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-base tracking-wide"
                  placeholder="••••••••••••••"
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-semibold animate-shake text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:brightness-105 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center cursor-pointer text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                'Ingresar a Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© 2026 Tribunal Electoral Estudiantil. Todos los derechos reservados.</p>
          <p className="mt-1 text-[#06b6d4]/80 font-semibold tracking-wider">Transmisión centralizada y cifrada en tiempo real.</p>
        </div>

      </div>
    </div>
  );
};
