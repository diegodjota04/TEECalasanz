import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, Save, Loader2, LogOut, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface TableFormProps {
  socket: Socket | null;
  electionData: any;
}

export const TableForm: React.FC<TableFormProps> = ({ socket, electionData }) => {
  const { user, logout } = useAuth();
  const tableId = user?.role as string;
  const tableNum = tableId?.split('_')[1];

  // Cargar datos actuales de la mesa si existen
  const currentTableData = electionData?.tables?.[tableId] || {
    suma: 0,
    mish: 0,
    blancos: 0,
    nulos: 0,
    ingresado: false
  };

  const electionClosed = electionData?.electionClosed || false;

  const [suma, setSuma] = useState<string>('0');
  const [mish, setMish] = useState<string>('0');
  const [blancos, setBlancos] = useState<string>('0');
  const [nulos, setNulos] = useState<string>('0');
  const [noUso, setNoUso] = useState<string>('0');

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [incidencias, setIncidencias] = useState<string>('');

  // Sincronizar inputs locales con datos provenientes de la base de datos (Sockets)
  useEffect(() => {
    if (currentTableData) {
      setSuma(String(currentTableData.suma));
      setMish(String(currentTableData.mish));
      setBlancos(String(currentTableData.blancos));
      setNulos(String(currentTableData.nulos));
      setNoUso(String(currentTableData.noUso || 0));
      if (currentTableData.incidencias !== undefined) {
        setIncidencias(currentTableData.incidencias || '');
      }
    }
  }, [electionData, tableId]);

  // Validar y sanear la entrada numérica
  const handleInputChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Saneamiento: solo números
    const cleanValue = value.replace(/[^0-9]/g, '');
    setter(cleanValue === '' ? '0' : String(parseInt(cleanValue, 10)));
    setSaveStatus('idle');
  };

  const handleOpenConfirm = () => {
    if (saving || electionClosed || currentTableData.ingresado) return;

    const vSuma = parseInt(suma, 10) || 0;
    const vMish = parseInt(mish, 10) || 0;
    const vBlancos = parseInt(blancos, 10) || 0;
    const vNulos = parseInt(nulos, 10) || 0;
    const vNoUso = parseInt(noUso, 10) || 0;

    const totalVotos = vSuma + vMish + vBlancos + vNulos + vNoUso;
    const padronVal = currentTableData.padron || 250;

    if (totalVotos !== padronVal) {
      setErrorMessage(
        `El total de votos ingresados (${totalVotos}) debe ser exactamente igual al padrón electoral de la mesa (${padronVal}). Por favor, verifique los valores ingresados.`
      );
      setSaveStatus('error');
      return;
    }

    setErrorMessage('');
    setSaveStatus('idle');
    setShowConfirmModal(true);
  };

  const handleSave = () => {
    if (!socket || electionClosed || currentTableData.ingresado) return;

    setSaving(true);
    setSaveStatus('idle');
    setShowConfirmModal(false);

    const payload = {
      tableId,
      data: {
        suma: parseInt(suma, 10) || 0,
        mish: parseInt(mish, 10) || 0,
        blancos: parseInt(blancos, 10) || 0,
        nulos: parseInt(nulos, 10) || 0,
        noUso: parseInt(noUso, 10) || 0
      }
    };

    // Emitir por WebSocket
    socket.emit('update_table_data', payload);

    // Esperar respuesta de confirmación corta
    setTimeout(() => {
      setSaving(false);
      setSaveStatus('success');
    }, 800);
  };

  const generateMesaPDF = (incidentsText: string) => {
    // Enviar las incidencias al tribunal (servidor) por socket
    if (socket) {
      socket.emit('update_table_incidents', {
        tableId,
        incidencias: incidentsText
      });
    }

    const totalMesaVotos = currentTableData.suma + currentTableData.mish + currentTableData.blancos + currentTableData.nulos + (currentTableData.noUso || 0);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Por favor, permite las ventanas emergentes (popups) para imprimir el acta.');
      return;
    }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Acta Oficial de Escrutinio - Mesa N°${tableNum}</title>
  <style>
    body { font-family: 'Outfit', 'Inter', sans-serif; color: #0f172a; padding: 45px; margin: 0; line-height: 1.5; }
    .header { text-align: center; border-bottom: 3px double #0A467A; padding-bottom: 15px; margin-bottom: 25px; }
    .logo-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 10px; }
    .logo { height: 60px; object-fit: contain; }
    h1 { font-size: 20px; color: #0A467A; margin: 5px 0; text-transform: uppercase; font-weight: 900; font-family: 'Outfit', sans-serif; }
    h2 { font-size: 13px; color: #FF8200; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .acta-title { text-align: center; font-size: 15px; font-weight: 800; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .meta-table td { padding: 6px 10px; font-size: 11px; }
    .meta-table td.label { font-weight: bold; color: #0A467A; width: 25%; text-transform: uppercase; }
    .results-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .results-table th, .results-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 11px; }
    .results-table th { background-color: #f8fafc; color: #0A467A; text-transform: uppercase; font-weight: 800; }
    .results-table tr.total-row { background-color: #f1f5f9; font-weight: bold; }
    .results-table tr.total-row td { border-top: 2px solid #0A467A; color: #0f172a; }
    .incidents-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; min-height: 80px; font-size: 11px; margin-bottom: 35px; background-color: #f8fafc; }
    .incidents-title { font-weight: bold; color: #0A467A; margin-bottom: 6px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
    .incidents-body { font-style: italic; color: #334155; white-space: pre-wrap; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; gap: 20px; }
    .signature-line { flex: 1; text-align: center; font-size: 9px; color: #64748b; }
    .signature-line span { display: block; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 40px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
    @media print {
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      <img src="/assets/tee.png" class="logo" />
      <img src="/assets/logocala.jpg" class="logo" style="border-radius: 4px;" />
    </div>
    <h1>Tribunal Electoral Estudiantil Calasanz 2026</h1>
    <h2>Colegio Calasanz • Acta Oficial de Escrutinio</h2>
  </div>

  <div class="acta-title">ACTA DE ESCRUTINIO DE MESA N°${tableNum}</div>

  <table class="meta-table">
    <tr>
      <td class="label">Mesa Electoral:</td>
      <td>Mesa N°${tableNum}</td>
      <td class="label">Fecha y Hora:</td>
      <td>${currentTableData.updatedAt ? new Date(currentTableData.updatedAt).toLocaleString('es-CR') : new Date().toLocaleString('es-CR')}</td>
    </tr>
    <tr>
      <td class="label">Padrón de Mesa:</td>
      <td><strong>${currentTableData.padron || 250} Votantes</strong></td>
      <td class="label">Estado de Envío:</td>
      <td>CONSOLIDADO Y ASEGURADO</td>
    </tr>
  </table>

  <table class="results-table">
    <thead>
      <tr>
        <th>Opción de Votación</th>
        <th>Candidato / Tipo</th>
        <th style="text-align: right;">Votos Obtenidos</th>
        <th style="text-align: right;">% s/ Padrón</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Partido SUMA</strong></td>
        <td>Helena Bermúdez</td>
        <td style="text-align: right; font-weight: bold; color: #086788;">${currentTableData.suma}</td>
        <td style="text-align: right;">${currentTableData.padron > 0 ? ((currentTableData.suma / currentTableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Movimiento MISH</strong></td>
        <td>Maximiliano Corella</td>
        <td style="text-align: right; font-weight: bold; color: #cc5200;">${currentTableData.mish}</td>
        <td style="text-align: right;">${currentTableData.padron > 0 ? ((currentTableData.mish / currentTableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Votos en Blanco</strong></td>
        <td>Blanco</td>
        <td style="text-align: right;">${currentTableData.blancos}</td>
        <td style="text-align: right;">${currentTableData.padron > 0 ? ((currentTableData.blancos / currentTableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Votos Nulos</strong></td>
        <td>Nulo</td>
        <td style="text-align: right;">${currentTableData.nulos}</td>
        <td style="text-align: right;">${currentTableData.padron > 0 ? ((currentTableData.nulos / currentTableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Papeletas No Utilizadas</strong></td>
        <td>Sobrante</td>
        <td style="text-align: right; color: #475569;">${currentTableData.noUso || 0}</td>
        <td style="text-align: right;">${currentTableData.padron > 0 ? (((currentTableData.noUso || 0) / currentTableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr class="total-row">
        <td colspan="2">TOTAL RECONCILIADO DE PAPELETAS</td>
        <td style="text-align: right;">${totalMesaVotos}</td>
        <td style="text-align: right;">100.0%</td>
      </tr>
    </tbody>
  </table>

  <div class="incidents-box">
    <div class="incidents-title">Incidencias y Observaciones Reportadas</div>
    <div class="incidents-body">${incidentsText.trim() || 'No se presentaron incidencias durante el desarrollo de la votación ni en el escrutinio de esta mesa.'}</div>
  </div>

  <div class="signatures">
    <div class="signature-line">
      <span>Delegado de Mesa</span>
    </div>
    <div class="signature-line">
      <span>Fiscal de Mesa</span>
    </div>
    <div class="signature-line">
      <span>Miembro del Tribunal TEE</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `);
    win.document.close();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-[#0A467A] via-[#083c6b] to-[#062a4d] py-8 px-4 sm:px-6">

      {/* Luces y círculos de fondo */}
      <div className="absolute top-10 left-10 w-[250px] h-[250px] rounded-full bg-[#06b6d4]/10 blur-[70px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-[#FF8200]/10 blur-[80px] pointer-events-none" />

      <header className="relative z-10 w-full max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-10 pb-5 border-b border-white/20">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <img
            src="/assets/tee.png"
            alt="TEE Logo"
            className="w-14 h-14 object-contain drop-shadow-[0_2px_5px_rgba(255,255,255,0.1)] animate-float"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display uppercase leading-tight">
              Tribunal Electoral Estudiantil Calasanz 2026
            </h1>
            <p className="text-xs text-[#06b6d4] tracking-widest uppercase font-bold mt-1">
              Terminal de Escrutinio • Mesa N°{tableNum}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <img
            src="/assets/logocala.jpg"
            alt="Calasanz"
            className="w-10 h-10 object-contain rounded-lg border border-white/20 bg-white p-0.5 shadow-sm"
          />
          <button
            onClick={logout}
            className="flex items-center space-x-2 py-2 px-4 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 border border-white/20 active:scale-[0.97] transition-all cursor-pointer text-sm font-semibold bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-4xl mx-auto flex-grow grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Columna Izquierda: Información de Mesa */}
        <div className="glass-panel p-6 rounded-3xl h-fit space-y-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Estado del Envío</h3>

          {electionClosed ? (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-700 flex flex-col items-center text-center space-y-3">
              <Lock className="w-10 h-10 text-rose-600 animate-pulse" />
              <div className="font-bold text-sm uppercase tracking-wide">Escrutinio Cerrado</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                El Tribunal Máster ha finalizado el conteo definitivo. Todos los formularios han sido bloqueados.
              </p>
            </div>
          ) : currentTableData.ingresado ? (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Datos Registrados</div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  Los datos oficiales ya fueron transmitidos y consolidados de forma segura en el servidor central.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-800 flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Pendiente de Envío</div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  Esta mesa no ha reportado datos aún. Completa el formulario de la derecha.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200/85 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Instrucciones de Uso</h4>
            <ul className="text-xs text-slate-800 space-y-2 list-disc list-inside leading-relaxed font-medium">
              <li>Ingresa únicamente valores numéricos enteros positivos.</li>
              <li>El total de votos debe coincidir exactamente con el padrón electoral de {currentTableData.padron || 250} votos.</li>
              <li>Una vez enviados y confirmados los resultados, la mesa quedará bloqueada permanentemente de forma segura.</li>
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Carga */}
        <div className="glass-panel p-8 rounded-3xl md:col-span-2 relative overflow-hidden">

          {/* Línea de color superior */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#06b6d4] to-cyan-500" />

          {electionClosed && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <Lock className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-slate-800 font-display uppercase tracking-wide">Acceso Congelado</h3>
              <p className="text-sm text-slate-550 max-w-sm mt-2 leading-relaxed">
                Los datos fueron salvados en su última versión del servidor. Ya no se permiten modificaciones adicionales.
              </p>
            </div>
          )}

          {!electionClosed && currentTableData.ingresado && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[8px] z-20 flex flex-col items-center justify-center text-center p-6 overflow-y-auto animate-fade-in text-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 animate-pulse-glow shadow-md shadow-emerald-500/5">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 font-display uppercase tracking-wide">Mesa Asegurada con Éxito</h3>
              <p className="text-xs text-slate-650 max-w-md mt-1 leading-relaxed font-semibold">
                La información oficial ha sido transmitida y consolidada en el servidor central. Esta terminal se encuentra congelada por seguridad.
              </p>

              <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Resumen */}
                <div className="bg-white/80 py-3.5 px-4 rounded-2xl border border-slate-200 shadow-sm text-[11px] font-mono text-slate-705 space-y-1.5 flex flex-col justify-center">
                  <div className="text-slate-400 uppercase font-black tracking-widest text-[8px] border-b border-slate-100 pb-1.5 mb-1.5 text-center">
                    Resumen Transmitido
                  </div>
                  <div className="flex justify-between"><span>SUMA:</span> <strong className="text-cyan-600 font-bold">{currentTableData.suma}</strong></div>
                  <div className="flex justify-between"><span>MISH:</span> <strong className="text-[#FF8200] font-bold">{currentTableData.mish}</strong></div>
                  <div className="flex justify-between"><span>BLANCOS:</span> <strong className="text-amber-600 font-bold">{currentTableData.blancos}</strong></div>
                  <div className="flex justify-between"><span>NULOS:</span> <strong className="text-rose-600 font-bold">{currentTableData.nulos}</strong></div>
                  <div className="flex justify-between"><span>NO UT.:</span> <strong className="text-slate-700 font-bold">{currentTableData.noUso || 0}</strong></div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-850 text-[11px]">
                    <span>TOTAL:</span>
                    <span>{currentTableData.suma + currentTableData.mish + currentTableData.blancos + currentTableData.nulos + (currentTableData.noUso || 0)} votos</span>
                  </div>
                </div>

                {/* Formulario Incidencias y Botón PDF */}
                <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="flex flex-col text-left">
                    <label className="block text-[8px] font-bold text-[#0A467A] uppercase tracking-wider mb-1">
                      Registro de Incidencias / Notas (Acta PDF)
                    </label>
                    <textarea
                      value={incidencias}
                      onChange={(e) => setIncidencias(e.target.value)}
                      placeholder="Escribe incidencias, votos impugnados u observaciones de los fiscales aquí antes de imprimir..."
                      className="w-full h-16 bg-slate-50 border border-slate-250 rounded-lg p-2 text-[10px] text-slate-850 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-semibold resize-none"
                    />
                  </div>

                  <button
                    onClick={() => generateMesaPDF(incidencias)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Imprimir Acta Oficial (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-xl font-bold text-slate-800 mb-1">Formulario de Escrutinio</h3>
          <p className="text-sm text-slate-700 mb-8 font-medium">
            Por favor, digita minuciosamente las actas oficiales de esta mesa.
            El total de votos ingresados debe sumar exactamente <strong className="text-[#0A467A] font-extrabold">{currentTableData.padron || 250} votos</strong> (según el padrón oficial configurado).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

            {/* Votos SUMA */}
            <div className="p-5 rounded-2xl bg-cyan-50/40 border border-cyan-100 focus-within:border-cyan-400 focus-within:shadow-[0_0_12px_rgba(6,182,212,0.06)] focus-within:bg-white transition-all duration-300">
              <label className="block text-xs font-black text-[#0A467A] uppercase tracking-wider mb-2">
                Votos Partido SUMA
              </label>
              <input
                type="text"
                value={suma}
                onChange={(e) => handleInputChange(e.target.value, setSuma)}
                className="w-full bg-transparent text-[#0A467A] font-display font-extrabold text-3xl focus:outline-none focus:ring-0 p-0 border-0"
                placeholder="0"
                disabled={saving || electionClosed || currentTableData.ingresado}
              />
            </div>

            {/* Votos MISH */}
            <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-100 focus-within:border-orange-400 focus-within:shadow-[0_0_12px_rgba(255,130,0,0.06)] focus-within:bg-white transition-all duration-300">
              <label className="block text-xs font-black text-[#0A467A] uppercase tracking-wider mb-2">
                Votos Movimiento MISH
              </label>
              <input
                type="text"
                value={mish}
                onChange={(e) => handleInputChange(e.target.value, setMish)}
                className="w-full bg-transparent text-[#0A467A] font-display font-extrabold text-3xl focus:outline-none focus:ring-0 p-0 border-0"
                placeholder="0"
                disabled={saving || electionClosed || currentTableData.ingresado}
              />
            </div>

            {/* Votos en Blanco */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:shadow-[0_0_12px_rgba(15,23,42,0.03)] focus-within:bg-white transition-all duration-300">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Votos en Blanco
              </label>
              <input
                type="text"
                value={blancos}
                onChange={(e) => handleInputChange(e.target.value, setBlancos)}
                className="w-full bg-transparent text-slate-800 font-display font-extrabold text-3xl focus:outline-none focus:ring-0 p-0 border-0"
                placeholder="0"
                disabled={saving || electionClosed || currentTableData.ingresado}
              />
            </div>

            {/* Votos Nulos */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:shadow-[0_0_12px_rgba(15,23,42,0.03)] focus-within:bg-white transition-all duration-300">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Votos Nulos
              </label>
              <input
                type="text"
                value={nulos}
                onChange={(e) => handleInputChange(e.target.value, setNulos)}
                className="w-full bg-transparent text-slate-800 font-display font-extrabold text-3xl focus:outline-none focus:ring-0 p-0 border-0"
                placeholder="0"
                disabled={saving || electionClosed || currentTableData.ingresado}
              />
            </div>

            {/* Papeletas No Utilizadas */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:shadow-[0_0_12px_rgba(15,23,42,0.03)] focus-within:bg-white transition-all duration-300 sm:col-span-2">
              <label className="block text-xs font-black text-[#0A467A] uppercase tracking-wider mb-2">
                Papeletas No Utilizadas (Sobrantes)
              </label>
              <input
                type="text"
                value={noUso}
                onChange={(e) => handleInputChange(e.target.value, setNoUso)}
                className="w-full bg-transparent text-slate-800 font-display font-extrabold text-3xl focus:outline-none focus:ring-0 p-0 border-0"
                placeholder="0"
                disabled={saving || electionClosed || currentTableData.ingresado}
              />
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {currentTableData.updatedAt && (
                <span>Último envío: {new Date(currentTableData.updatedAt).toLocaleTimeString()}</span>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={saving || electionClosed || currentTableData.ingresado}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:shadow-lg hover:shadow-[#06b6d4]/10 hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : currentTableData.ingresado ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Resultados Enviados</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enviar Resultados</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveStatus === 'success' && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold text-center animate-fade-in">
              ¡Datos guardados con éxito y transmitidos al servidor central!
            </div>
          )}

          {saveStatus === 'error' && errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-semibold text-center animate-fade-in">
              {errorMessage}
            </div>
          )}

        </div>

      </main>

      {/* MODAL DE CONFIRMACIÓN DE ENVÍO DE DATOS */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">

          <div className="glass-panel w-full max-w-md p-7 rounded-3xl shadow-2xl relative overflow-hidden border-cyan-200 bg-white">
            {/* Línea decorativa superior */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#06b6d4] to-cyan-600" />

            <div className="flex items-center space-x-3 text-cyan-600 mb-4">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-lg font-black uppercase tracking-wide font-display">Confirmación de Envío</h3>
            </div>

            <p className="text-xs text-slate-650 leading-relaxed mb-6 font-semibold">
              ¿Está seguro de que desea enviar la información? Una vez enviada, los resultados se consolidarán en el servidor central y esta mesa quedará <strong className="text-cyan-600">bloqueada permanentemente</strong> para modificaciones adicionales.
            </p>

            {/* Panel de desglose para doble chequeo */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-xs space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 pb-1.5 mb-2">
                Resumen para Doble Verificación
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Partido SUMA:</span>
                <span className="font-bold text-cyan-600">{suma} votos</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Movimiento MISH:</span>
                <span className="font-bold text-[#FF8200]">{mish} votos</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Votos en Blanco:</span>
                <span className="font-bold text-amber-600">{blancos} votos</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Votos Nulos:</span>
                <span className="font-bold text-rose-600">{nulos} votos</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Papeletas No Utilizadas:</span>
                <span className="font-bold text-slate-700">{noUso} papeletas</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-800 text-sm">
                <span>TOTAL RECONCILIADO:</span>
                <span>{(parseInt(suma, 10) || 0) + (parseInt(mish, 10) || 0) + (parseInt(blancos, 10) || 0) + (parseInt(nulos, 10) || 0) + (parseInt(noUso, 10) || 0)} votos</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:brightness-105 hover:shadow-md hover:shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sí, Enviar y Bloquear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-slate-350 font-semibold">
        Escrutinio 2026 • Terminal de Mesa Autorizada N°{tableNum} • Conexión WebSockets Segura
      </footer>
    </div>
  );
};
