import React from 'react';
import { Award, RefreshCw } from 'lucide-react';

interface PartyConfig {
  name: string;
  color: string;
  secondaryColor: string;
  flag: string;
  mascot: string;
  presidentName: string;
  presidentPhoto: string;
}

interface VictoryScreenProps {
  parties: {
    SUMA: PartyConfig;
    MISH: PartyConfig;
  };
  metrics: {
    votosSuma: number;
    votosMish: number;
    votosValidos: number;
  };
  isMaster: boolean;
  onReset?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ parties, metrics, isMaster, onReset }) => {
  const { votosSuma, votosMish, votosValidos } = metrics;

  const [showResetConfirmModal, setShowResetConfirmModal] = React.useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = React.useState<string>('');
  const [resetConfirmError, setResetConfirmError] = React.useState<string>('');

  const handleConfirmReset = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'REINICIAR') {
      setResetConfirmError('Escribe estrictamente la palabra "REINICIAR" para continuar.');
      return;
    }
    if (onReset) onReset();
    setShowResetConfirmModal(false);
    setResetConfirmInput('');
    setResetConfirmError('');
  };

  // Determinar ganador
  const isSumaWinner = votosSuma >= votosMish;
  const winnerParty = isSumaWinner ? parties.SUMA : parties.MISH;
  const loserParty = isSumaWinner ? parties.MISH : parties.SUMA;
  const winnerVotes = isSumaWinner ? votosSuma : votosMish;
  const loserVotes = isSumaWinner ? votosMish : votosSuma;

  const winnerPercentage = votosValidos > 0 ? ((winnerVotes / votosValidos) * 100).toFixed(1) : '50.0';
  const loserPercentage = votosValidos > 0 ? ((loserVotes / votosValidos) * 100).toFixed(1) : '50.0';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0A467A] via-[#083c6b] to-[#062a4d] overflow-hidden text-white font-sans">
      
      {/* 1. BANDERA DEL GANADOR EN FONDO DIFUMINADO */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.08] scale-110 filter blur-[20px] transition-all duration-1000"
        style={{ backgroundImage: `url(${winnerParty.flag})` }}
      />
      
      {/* Capa gradiente de atenuación */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A467A]/90 via-[#083c6b]/60 to-transparent" />

      {/* Partículas de celebración flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              backgroundColor: winnerParty.color,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 6 + 4}s`,
              animationDelay: `${Math.random() * 4}s`,
              boxShadow: `0 0 10px ${winnerParty.color}`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col items-center">
        
        {/* Escudo del Colegio Institucional en las Visualizaciones */}
        <img 
          src="/assets/logocala.jpg" 
          alt="Escudo Calasanz" 
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl border border-white/20 bg-white p-1.5 shadow-lg shadow-white/5 mb-6 animate-pulse-glow" 
        />

        {/* Insignia victoria superior */}
        <div className="flex items-center space-x-2 py-2 px-6 rounded-full bg-white/10 border border-white/20 mb-8 animate-float shadow-md">
          <Award className="w-5 h-5 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-black uppercase tracking-widest text-[#06b6d4] text-glow-cyan">
            Resultado Escrutinio Oficial 2026
          </span>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          {/* BLOQUE IZQUIERDO: MASCOTA DEL GANADOR ANIMADA */}
          <div className="flex flex-col items-center justify-center text-center order-2 lg:order-1">
            <div 
              className="relative w-64 h-64 rounded-3xl overflow-hidden glass-panel border-white/25 p-4 shadow-xl flex items-center justify-center group bg-white/10"
              style={{
                boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 40px ${winnerParty.color}25`
              }}
            >
              {/* Círculo neon de fondo */}
              <div 
                className="absolute inset-2 rounded-2xl bg-gradient-to-tr opacity-15 blur-md"
                style={{ backgroundImage: `linear-gradient(to top right, ${winnerParty.color}, ${winnerParty.secondaryColor})` }}
              />
              
              <img 
                src={winnerParty.mascot} 
                alt="Mascota del Partido Ganador" 
                className="relative z-10 w-full h-full object-cover rounded-2xl animate-float transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mascota de Campaña
              </span>
              <h4 className="text-lg font-black text-white font-display mt-1">Símbolo del Liderazgo</h4>
            </div>
          </div>

          {/* BLOQUE CENTRAL: PORCENTAJES Y PROCLAMACIÓN */}
          <div className="flex flex-col items-center text-center order-1 lg:order-2">
            <h2 className="text-lg font-black tracking-widest text-slate-300 uppercase font-display mb-1">
              Presidente Electo
            </h2>
            
            <h1 
              className="text-4xl lg:text-5xl font-black font-display tracking-tight text-white mb-2 leading-none uppercase text-glow-cyan"
              style={{ textShadow: `0 0 25px ${winnerParty.color}40` }}
            >
              {winnerParty.name}
            </h1>

            <div 
              className="text-6xl lg:text-7xl font-black font-display tracking-tighter mt-4 mb-2"
              style={{ color: winnerParty.color, textShadow: `0 4px 20px ${winnerParty.color}40` }}
            >
              {winnerPercentage}%
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-[#06b6d4] bg-white/10 border border-white/20 py-1.5 px-4 rounded-full mb-8 shadow-sm">
              {winnerVotes} Votos Válidos
            </div>

            {/* Barra Comparativa */}
            <div className="w-full max-w-md glass-panel p-5 rounded-3xl border-white/25 shadow-md">
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-2 uppercase">
                <span>{winnerParty.name}</span>
                <span>{loserParty.name}</span>
              </div>
              <div className="h-4 w-full bg-slate-200/50 rounded-full overflow-hidden flex">
                <div 
                  className="h-full rounded-l-full transition-all duration-1000"
                  style={{ 
                    width: `${winnerPercentage}%`, 
                    backgroundColor: winnerParty.color,
                    boxShadow: `0 0 10px ${winnerParty.color}25`
                  }}
                />
                <div 
                  className="h-full rounded-r-full opacity-35 transition-all duration-1000"
                  style={{ 
                    width: `${loserPercentage}%`, 
                    backgroundColor: loserParty.color 
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-bold">
                <span>{winnerPercentage}% ({winnerVotes} votos)</span>
                <span>{loserPercentage}% ({loserVotes} votos)</span>
              </div>
            </div>
          </div>

          {/* BLOQUE DERECHO: FOTO DEL PRESIDENTE CON MARCO ILUMINADO */}
          <div className="flex flex-col items-center justify-center text-center order-3">
            <div 
              className="relative w-64 h-64 rounded-3xl overflow-hidden p-[3px] shadow-xl flex items-center justify-center group"
              style={{
                background: `linear-gradient(135deg, ${winnerParty.color}, ${winnerParty.secondaryColor})`,
                boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 45px ${winnerParty.color}25`
              }}
            >
              {/* Marco Interno Iluminado */}
              <div className="absolute inset-0 bg-[#0A467A] rounded-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-10" />
              
              <img 
                src={winnerParty.presidentPhoto} 
                alt="Presidente electo" 
                className="relative z-10 w-full h-full object-cover rounded-2xl transition-transform duration-750 group-hover:scale-[1.03]"
              />
            </div>
            
            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Presidente Electo 2026
              </span>
              <h4 className="text-xl font-black text-white font-display mt-1">{winnerParty.presidentName}</h4>
            </div>
          </div>

        </div>

        {/* Botón de reinicio (Solo disponible para el Tribunal Máster en su sesión) */}
        {isMaster && onReset && (
          <button
            onClick={() => {
              setShowResetConfirmModal(true);
              setResetConfirmInput('');
              setResetConfirmError('');
            }}
            className="mt-16 flex items-center space-x-2.5 py-3.5 px-7 rounded-xl text-sm font-bold text-slate-200 bg-white/10 border border-white/20 hover:text-white hover:bg-white/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Reiniciar Elección (Tribunal)</span>
          </button>
        )}

      </div>

      {/* MODAL DE SEGURIDAD PARA REINICIAR PROCESO EN VICTORIA */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="glass-panel w-full max-w-md p-7 rounded-3xl shadow-2xl relative overflow-hidden border-orange-200 bg-white">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500" />

            <div className="flex items-center space-x-3 text-orange-600 mb-4">
              <span className="w-6 h-6 animate-pulse font-black text-xl">⚠️</span>
              <h3 className="text-lg font-black uppercase tracking-wide font-display text-orange-600">Reiniciar Proceso</h3>
            </div>

            <p className="text-xs text-slate-650 leading-relaxed mb-6 font-semibold">
              ¿Está completamente seguro de que desea reiniciar todo el proceso electoral desde la pantalla de victoria? Se borrarán todos los datos ingresados en las mesas y se regresará a la pantalla de configuración inicial. Esta acción no se puede deshacer.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Escribe la palabra clave <strong className="text-orange-600">"REINICIAR"</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={(e) => {
                    setResetConfirmInput(e.target.value);
                    if (resetConfirmError) setResetConfirmError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 rounded-xl px-4 py-3 text-slate-800 font-mono uppercase tracking-widest text-center text-sm focus:outline-none shadow-inner"
                  placeholder="PALABRA CLAVE"
                />
              </div>

              {resetConfirmError && (
                <div className="text-[11px] font-bold text-rose-600 text-center animate-shake">
                  {resetConfirmError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setShowResetConfirmModal(false);
                    setResetConfirmInput('');
                    setResetConfirmError('');
                  }}
                  className="py-3.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="py-3.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 hover:shadow-md hover:shadow-orange-500/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Sí, Reiniciar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
