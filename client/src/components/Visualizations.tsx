import React from 'react';
import { EyeOff } from 'lucide-react';

interface PartyConfig {
  name: string;
  color: string;
  secondaryColor: string;
}

interface Metrics {
  votosSuma: number;
  votosMish: number;
  votosBlancos: number;
  votosNulos: number;
  votosNoUso: number;
  votosTotales: number;
  votosValidos: number;
}

interface VisualizationsProps {
  metrics: Metrics;
  parties: {
    SUMA: PartyConfig;
    MISH: PartyConfig;
  };
  toggles: {
    showValidosChart: boolean;
    showGlobalesChart: boolean;
    showMetrics: boolean;
  };
}

export const Visualizations: React.FC<VisualizationsProps> = ({ metrics, parties, toggles }) => {
  const { votosSuma, votosMish, votosBlancos, votosNulos, votosNoUso, votosTotales, votosValidos } = metrics;

  // Evitar división por cero
  const totalBarMax = Math.max(votosTotales, votosValidos, votosSuma, votosMish, 1);

  // Helper para generar arcos SVG para gráficos circulares
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // Renderizar segmentos de Gráfico de
  const renderPieSegments = (data: { value: number; color: string; label: string }[]) => {
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    if (sum === 0) {
      return (
        <circle cx="0" cy="0" r="1" fill="#1e293b" />
      );
    }

    let accumulatedPercent = 0;
    return data.map((slice, index) => {
      const percent = slice.value / sum;
      if (percent === 1) {
        return <circle key={index} cx="0" cy="0" r="1" fill={slice.color} />;
      }

      const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
      accumulatedPercent += percent;
      const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);

      const largeArcFlag = percent > 0.5 ? 1 : 0;

      // Generar path
      const pathData = [
        `M 0 0`,
        `L ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');

      return (
        <path
          key={index}
          d={pathData}
          fill={slice.color}
          className="transition-all duration-500 hover:scale-[1.05] hover:brightness-110 origin-center cursor-pointer"
          style={{ transitionDelay: `${index * 50}ms` }}
        />
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* 1. GRÁFICO DE BARRAS PRINCIPAL */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between col-span-1 lg:col-span-1 min-h-[380px]">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#06b6d4] to-[#FF8200]" />

        {!toggles.showMetrics ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 space-y-4 my-auto h-full w-full">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 animate-pulse shadow-sm">
              <EyeOff className="w-8 h-8 text-[#0A467A]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0A467A] uppercase tracking-wider">Visualización Oculta</h4>
              <p className="text-[11px] text-slate-600 max-w-[220px] mx-auto mt-2 leading-relaxed font-semibold">
                Las métricas generales del escrutinio han sido ocultadas por el Tribunal de forma segura.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Métricas Generales</h3>
                <p className="text-xs text-slate-500 font-medium">Distribución de votos globales acumulados</p>
              </div>
              <img
                src="/assets/logocala.jpg"
                alt="Escudo Calasanz"
                className="w-12 h-12 object-contain rounded-xl border border-slate-255 bg-white p-0.5 shadow-sm"
              />
            </div>

            <div className="my-6 space-y-4 flex-grow flex flex-col justify-center">
              {/* Votos Totales */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                  <span>Votos Totales (Participación)</span>
                  <span className="text-slate-800">{votosTotales}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    style={{ width: `${(votosTotales / totalBarMax) * 100}%` }}
                  />
                </div>
              </div>

              {/* Votos Válidos */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                  <span>Votos Válidos (SUMA + MISH)</span>
                  <span className="text-[#06b6d4]">{votosValidos}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    style={{ width: `${(votosValidos / totalBarMax) * 100}%` }}
                  />
                </div>
              </div>

              {/* Votos en Blanco */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                  <span>Votos en Blanco</span>
                  <span className="text-amber-600">{votosBlancos}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500/80 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    style={{ width: `${(votosBlancos / totalBarMax) * 100}%` }}
                  />
                </div>
              </div>

              {/* Votos Nulos */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                  <span>Votos Nulos</span>
                  <span className="text-rose-600">{votosNulos}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500/85 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                    style={{ width: `${(votosNulos / totalBarMax) * 100}%` }}
                  />
                </div>
              </div>

              {/* Papeletas No Utilizadas */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                  <span>Papeletas No Utilizadas</span>
                  <span className="text-slate-600 font-bold">{votosNoUso}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(148,163,184,0.2)]"
                    style={{ width: `${(votosNoUso / totalBarMax) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-[10px] text-slate-450 flex justify-between font-semibold">
          <span>Actualización en tiempo real</span>
          <span>Escrutinio 2026</span>
        </div>
      </div>

      {/* 2. GRÁFICO CIRCULAR 3D VOTOS VÁLIDOS */}
      <div
        className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between items-center min-h-[380px] bg-white transition-all duration-500"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#06b6d4]" />

        {!toggles.showValidosChart ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 space-y-4 my-auto h-full w-full">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 animate-pulse shadow-sm">
              <EyeOff className="w-8 h-8 text-[#0A467A]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0A467A] uppercase tracking-wider">Visualización Oculta</h4>
              <p className="text-[11px] text-slate-600 max-w-[220px] mx-auto mt-2 leading-relaxed font-semibold">
                La gráfica de votos válidos ha sido ocultada por el Tribunal de forma segura.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Escrutinio Votos Válidos</h3>
              <p className="text-xs text-slate-500 font-medium">Distribución porcentual: SUMA vs MISH</p>
            </div>

            {/* Cesta 3D Isometric */}
            <div className="relative w-44 h-44 my-4 flex items-center justify-center" style={{ perspective: '800px' }}>

              {/* Sombra de la Gráfico de 3D */}
              <div className="absolute bottom-[-10px] w-36 h-8 bg-slate-400/25 rounded-full blur-md transform -rotate-x-12" />

              {/* Gráfico circular con rotación 3D */}
              <div className="w-36 h-36 transform rotate-x-[50deg] rotate-z-[-20deg] preserve-3d transition-transform duration-700 hover:rotate-x-[40deg] cursor-pointer">

                {/* Capa de Extrusión 3D inferior (da espesor) */}
                <div className="absolute inset-0 translate-z-[-12px] opacity-70">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full transform scale-[0.98]">
                    {renderPieSegments([
                      { value: votosSuma, color: '#086788', label: 'SUMA' },
                      { value: votosMish, color: '#cc5200', label: 'MISH' }
                    ])}
                  </svg>
                </div>

                {/* Capa Frontal Superior */}
                <div className="absolute inset-0">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full shadow-lg rounded-full">
                    {renderPieSegments([
                      { value: votosSuma, color: parties.SUMA.color, label: 'SUMA' },
                      { value: votosMish, color: parties.MISH.color, label: 'MISH' }
                    ])}
                  </svg>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#06b6d4] block shadow-[0_0_6px_rgba(6,182,212,0.3)]" />
                <div className="text-xs text-slate-500">
                  <div className="font-bold text-slate-800">SUMA</div>
                  <div>{votosValidos > 0 ? ((votosSuma / votosValidos) * 100).toFixed(1) : 0}%</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#FF8200] block shadow-[0_0_6px_rgba(255,130,0,0.3)]" />
                <div className="text-xs text-slate-500">
                  <div className="font-bold text-slate-800">MISH</div>
                  <div>{votosValidos > 0 ? ((votosMish / votosValidos) * 100).toFixed(1) : 0}%</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. GRÁFICO CIRCULAR 3D GLOBAL */}
      <div
        className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between items-center min-h-[380px] bg-white transition-all duration-500"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF8200]" />

        {!toggles.showGlobalesChart ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 space-y-4 my-auto h-full w-full">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 animate-pulse shadow-sm">
              <EyeOff className="w-8 h-8 text-[#0A467A]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0A467A] uppercase tracking-wider">Visualización Oculta</h4>
              <p className="text-[11px] text-slate-600 max-w-[220px] mx-auto mt-2 leading-relaxed font-semibold">
                La gráfica de escrutinio global ha sido ocultada por el Tribunal de forma segura.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Escrutinio Global</h3>
              <p className="text-xs text-slate-500 font-medium">Distribución global del 100% de los votos</p>
            </div>

            {/* Cesta 3D Isometric */}
            <div className="relative w-44 h-44 my-4 flex items-center justify-center" style={{ perspective: '800px' }}>

              {/* Sombra */}
              <div className="absolute bottom-[-10px] w-36 h-8 bg-slate-400/25 rounded-full blur-md transform -rotate-x-12" />

              {/* Gráfico circular con rotación 3D */}
              <div className="w-36 h-36 transform rotate-x-[50deg] rotate-z-[-40deg] preserve-3d transition-transform duration-700 hover:rotate-x-[40deg] cursor-pointer">

                {/* Capa de Extrusión 3D inferior */}
                <div className="absolute inset-0 translate-z-[-12px] opacity-70">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full transform scale-[0.98]">
                    {renderPieSegments([
                      { value: votosSuma, color: '#086788', label: 'SUMA' },
                      { value: votosMish, color: '#cc5200', label: 'MISH' },
                      { value: votosBlancos, color: '#78350f', label: 'Blancos' },
                      { value: votosNulos, color: '#881337', label: 'Nulos' },
                      { value: votosNoUso, color: '#475569', label: 'No Utilizadas' }
                    ])}
                  </svg>
                </div>

                {/* Capa Frontal Superior */}
                <div className="absolute inset-0">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full shadow-lg rounded-full">
                    {renderPieSegments([
                      { value: votosSuma, color: parties.SUMA.color, label: 'SUMA' },
                      { value: votosMish, color: parties.MISH.color, label: 'MISH' },
                      { value: votosBlancos, color: '#d97706', label: 'Blancos' },
                      { value: votosNulos, color: '#e11d48', label: 'Nulos' },
                      { value: votosNoUso, color: '#94a3b8', label: 'No Utilizadas' }
                    ])}
                  </svg>
                </div>
              </div>
            </div>

            {/* Leyenda extendida */}
            <div className="w-full grid grid-cols-5 gap-0.5 text-[9px] mt-2 font-semibold">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] mb-1" />
                <span className="text-slate-800 font-bold">SUMA</span>
                <span className="text-slate-500">{votosTotales > 0 ? ((votosSuma / votosTotales) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF8200] mb-1" />
                <span className="text-slate-800 font-bold">MISH</span>
                <span className="text-slate-500">{votosTotales > 0 ? ((votosMish / votosTotales) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] mb-1" />
                <span className="text-slate-800 font-bold">Blancos</span>
                <span className="text-slate-500">{votosTotales > 0 ? ((votosBlancos / votosTotales) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] mb-1" />
                <span className="text-slate-800 font-bold">Nulos</span>
                <span className="text-slate-500">{votosTotales > 0 ? ((votosNulos / votosTotales) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] mb-1" />
                <span className="text-slate-800 font-bold truncate max-w-[45px]">No Usadas</span>
                <span className="text-slate-500">{votosTotales > 0 ? ((votosNoUso / votosTotales) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
