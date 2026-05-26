import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Visualizations } from './Visualizations';
import {
  ShieldAlert,
  Settings,
  Play,
  Eye,
  EyeOff,
  Lock,
  Users,
  Activity,
  RefreshCw,
  LogOut,
  Sparkles,
  Printer
}
  from 'lucide-react';
import { Socket } from 'socket.io-client';

interface MasterDashboardProps {
  socket: Socket | null;
  electionData: any;
  onReset: () => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ socket, electionData, onReset }) => {
  const { logout } = useAuth();

  const [activeTables, setActiveTables] = useState<number>(5);
  const showValidosChart = electionData?.revealed?.validosChart || false;
  const showGlobalesChart = electionData?.revealed?.globalesChart || false;
  const showMetrics = electionData?.revealed?.metrics || false;
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string>('');

  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');
  const [resetConfirmError, setResetConfirmError] = useState<string>('');

  const [padronesConfig, setPadronesConfig] = useState<{ [key: string]: string }>({
    table_1: '86',
    table_2: '87',
    table_3: '84',
    table_4: '89',
    table_5: '0'
  });

  // Estados de inicialización de partidos
  const [sumaName, setSumaName] = useState('Partido SUMA');
  const [sumaColor] = useState('#06b6d4');
  const [sumaFlag, setSumaFlag] = useState('/assets/suma_flag.png');
  const [sumaMascot, setSumaMascot] = useState('/assets/suma_mascot.png');
  const [sumaPres, setSumaPres] = useState('Helena Bermúdez');
  const [sumaPresPhoto, setSumaPresPhoto] = useState('/assets/suma_president.png');

  const [mishName, setMishName] = useState('Partido MISH');
  const [mishColor] = useState('#FF8200');
  const [mishFlag, setMishFlag] = useState('/assets/mish_flag.png');
  const [mishMascot, setMishMascot] = useState('/assets/mish_mascot.png');
  const [mishPres, setMishPres] = useState('Maximiliano Corella');
  const [mishPresPhoto, setMishPresPhoto] = useState('/assets/mish_president.png');

  const isInitialized = electionData?.initialized || false;
  const activeTablesCount = electionData?.activeTablesCount || 5;
  const tables = electionData?.tables || {};
  const metrics = electionData?.metrics || {
    votosSuma: 0,
    votosMish: 0,
    votosBlancos: 0,
    votosNulos: 0,
    votosTotales: 0,
    votosValidos: 0,
    mesasIngresadasCount: 0,
    porcentajeParticipacion: 0
  };

  let activePadrónTotal = 0;
  for (let i = 1; i <= activeTablesCount; i++) {
    const key = `table_${i}`;
    const table = tables[key] || {};
    activePadrónTotal += table.padron || 250;
  }
  const castVotes = metrics.votosTotales - (metrics.votosNoUso || 0);
  const globalParticipation = activePadrónTotal > 0 ? (castVotes / activePadrónTotal) * 100 : 0;

  const partiesConfig = electionData?.partiesConfig || {
    SUMA: { name: 'SUMA', color: '#06b6d4', flag: '', mascot: '', presidentName: '', presidentPhoto: '' },
    MISH: { name: 'MISH', color: '#FF8200', flag: '', mascot: '', presidentName: '', presidentPhoto: '' }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePadronChange = (tableKey: string, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    setPadronesConfig(prev => ({
      ...prev,
      [tableKey]: cleanVal === '' ? '0' : String(parseInt(cleanVal, 10))
    }));
  };

  const handleInitialize = () => {
    if (!socket) return;

    const payload = {
      activeTablesCount: activeTables,
      tablePadrones: padronesConfig,
      partiesConfig: {
        SUMA: {
          name: sumaName,
          color: sumaColor,
          flag: sumaFlag,
          mascot: sumaMascot,
          presidentName: sumaPres,
          presidentPhoto: sumaPresPhoto
        },
        MISH: {
          name: mishName,
          color: mishColor,
          flag: mishFlag,
          mascot: mishMascot,
          presidentName: mishPres,
          presidentPhoto: mishPresPhoto
        }
      }
    };

    socket.emit('initialize_election', payload);
  };

  const handleFinalize = () => {
    // Validar palabra clave de doble confirmación
    if (confirmInput.trim().toUpperCase() !== 'FINALIZAR') {
      setConfirmError('Escribe estrictamente la palabra "FINALIZAR" para continuar.');
      return;
    }

    if (!socket) return;
    socket.emit('finalize_election');
    setShowConfirmModal(false);
    setConfirmInput('');
    setConfirmError('');
  };

  const handleConfirmReset = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'REINICIAR') {
      setResetConfirmError('Escribe estrictamente la palabra "REINICIAR" para continuar.');
      return;
    }
    onReset();
    setShowResetConfirmModal(false);
    setResetConfirmInput('');
    setResetConfirmError('');
  };

  const generateMesaPDF = (tableNum: number, tableData: any) => {
    const totalMesaVotos = tableData.suma + tableData.mish + tableData.blancos + tableData.nulos + (tableData.noUso || 0);
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
      <td>${tableData.updatedAt ? new Date(tableData.updatedAt).toLocaleString('es-CR') : new Date().toLocaleString('es-CR')}</td>
    </tr>
    <tr>
      <td class="label">Padrón de Mesa:</td>
      <td><strong>${tableData.padron || 250} Votantes</strong></td>
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
        <td style="text-align: right; font-weight: bold; color: #086788;">${tableData.suma}</td>
        <td style="text-align: right;">${tableData.padron > 0 ? ((tableData.suma / tableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Movimiento MISH</strong></td>
        <td>Maximiliano Corella</td>
        <td style="text-align: right; font-weight: bold; color: #cc5200;">${tableData.mish}</td>
        <td style="text-align: right;">${tableData.padron > 0 ? ((tableData.mish / tableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Votos en Blanco</strong></td>
        <td>Blanco</td>
        <td style="text-align: right;">${tableData.blancos}</td>
        <td style="text-align: right;">${tableData.padron > 0 ? ((tableData.blancos / tableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Votos Nulos</strong></td>
        <td>Nulo</td>
        <td style="text-align: right;">${tableData.nulos}</td>
        <td style="text-align: right;">${tableData.padron > 0 ? ((tableData.nulos / tableData.padron) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td><strong>Papeletas No Utilizadas</strong></td>
        <td>Sobrante</td>
        <td style="text-align: right; color: #475569;">${tableData.noUso || 0}</td>
        <td style="text-align: right;">${tableData.padron > 0 ? (((tableData.noUso || 0) / tableData.padron) * 100).toFixed(1) : 0}%</td>
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
    <div class="incidents-body">${tableData.incidencias?.trim() || 'No se presentaron incidencias durante el desarrollo de la votación ni en el escrutinio de esta mesa.'}</div>
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

  const generateConsolidatedPDF = () => {
    // Determinar ganador
    const vSuma = metrics.votosSuma || 0;
    const vMish = metrics.votosMish || 0;
    let winnerName = 'EMPATE TÉCNICO';
    let winnerParty = 'N/A';
    if (vSuma > vMish) {
      winnerName = partiesConfig.SUMA?.presidentName || 'Helena Bermúdez';
      winnerParty = partiesConfig.SUMA?.name || 'Partido SUMA';
    } else if (vMish > vSuma) {
      winnerName = partiesConfig.MISH?.presidentName || 'Maximiliano Corella';
      winnerParty = partiesConfig.MISH?.name || 'Movimiento MISH';
    }

    // Tabla de resultados mesa por mesa
    let rowsHTML = '';
    let totalPadrón = 0;
    let totalSUMA = 0;
    let totalMISH = 0;
    let totalBlancos = 0;
    let totalNulos = 0;
    let totalNoUso = 0;

    for (let i = 1; i <= activeTablesCount; i++) {
      const key = `table_${i}`;
      const t = tables[key] || { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0 };
      totalPadrón += t.padron || 0;
      totalSUMA += t.suma || 0;
      totalMISH += t.mish || 0;
      totalBlancos += t.blancos || 0;
      totalNulos += t.nulos || 0;
      totalNoUso += t.noUso || 0;

      rowsHTML += `
        <tr>
          <td>Mesa N°${i}</td>
          <td style="text-align: right;">${t.suma}</td>
          <td style="text-align: right;">${t.mish}</td>
          <td style="text-align: right;">${t.blancos}</td>
          <td style="text-align: right;">${t.nulos}</td>
          <td style="text-align: right;">${t.noUso || 0}</td>
          <td style="text-align: right;">${t.padron || 250}</td>
        </tr>
      `;
    }

    // Consolidado de incidencias
    let incidentsHTML = '';
    for (let i = 1; i <= activeTablesCount; i++) {
      const key = `table_${i}`;
      const t = tables[key] || {};
      if (t.incidencias && t.incidencias.trim() !== '') {
        incidentsHTML += `
          <div style="margin-bottom: 10px; font-size: 11px; color: #334155; border-left: 2px solid #0A467A; padding-left: 10px;">
            <strong>MESA N°${i}:</strong> ${t.incidencias.trim()}
          </div>
        `;
      }
    }
    if (!incidentsHTML) {
      incidentsHTML = '<div style="font-size: 11px; color: #64748b; font-style: italic;">No se reportaron incidencias o reclamos en ninguna de las mesas de votación.</div>';
    }

    const win = window.open('', '_blank');
    if (!win) {
      alert('Por favor, permite las ventanas emergentes (popups) para imprimir el acta.');
      return;
    }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Acta Final de Consolidación Escrutinio - TEE 2026</title>
  <style>
    body { font-family: 'Outfit', 'Inter', sans-serif; color: #0f172a; padding: 45px; margin: 0; line-height: 1.4; }
    .header { text-align: center; border-bottom: 3px double #0A467A; padding-bottom: 15px; margin-bottom: 25px; }
    .logo-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 10px; }
    .logo { height: 65px; object-fit: contain; }
    h1 { font-size: 22px; color: #0A467A; margin: 5px 0; text-transform: uppercase; font-weight: 900; font-family: 'Outfit', sans-serif; }
    h2 { font-size: 14px; color: #FF8200; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-family: 'Outfit', sans-serif; }
    .acta-title { text-align: center; font-size: 16px; font-weight: 800; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; text-decoration: underline; }
    
    .proclamation-panel { border: 2px solid #0A467A; border-radius: 12px; padding: 20px; margin-bottom: 25px; background-color: #f8fafc; text-align: center; }
    .proclamation-title { font-size: 11px; font-weight: bold; color: #0A467A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .proclamation-winner { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
    .proclamation-party { font-size: 13px; font-weight: bold; color: #FF8200; text-transform: uppercase; }

    .results-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .results-table th, .results-table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; }
    .results-table th { background-color: #f1f5f9; color: #0A467A; text-transform: uppercase; font-weight: 800; }
    .results-table tr.total-row { background-color: #e2e8f0; font-weight: bold; }
    .results-table tr.total-row td { border-top: 2px solid #0A467A; color: #0f172a; }

    .incidents-box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 10px; margin-bottom: 35px; background-color: #f8fafc; }
    .incidents-title { font-weight: bold; color: #0A467A; margin-bottom: 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }

    .signatures-title { font-weight: bold; color: #0A467A; text-transform: uppercase; font-size: 11px; margin-bottom: 15px; text-align: center; letter-spacing: 1px; }
    .signatures-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 40px; margin-top: 20px; }
    .signatures-grid-bottom { display: flex; justify-content: center; gap: 40px; margin-top: 20px; }
    .signature-line { text-align: center; font-size: 9px; color: #64748b; }
    .signature-line span { display: block; border-top: 1px solid #94a3b8; padding-top: 6px; margin-top: 40px; font-weight: bold; text-transform: uppercase; color: #0f172a; }

    @media print {
      body { padding: 10px; }
      .signatures-grid { gap: 15px 30px; }
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
    <h2>Colegio Calasanz • Declaratoria y Acta de Escrutinio Consolidado</h2>
  </div>

  <div class="acta-title">ACTA FINAL CONSOLIDADA DE ESCRUTINIO GENERAL</div>

  <div class="proclamation-panel">
    <div class="proclamation-title">DECLARATORIA OFICIAL DE FÓRMULA GANADORA</div>
    <div class="proclamation-winner">${winnerName}</div>
    <div class="proclamation-party">PRESIDENTE ELECTO • ${winnerParty}</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 8px; font-weight: bold;">
      Participación Electoral Total: ${metrics.mesasIngresadasCount === metrics.totalMesasActivas ? globalParticipation.toFixed(1) : 0}% • Total de Votos Emitidos: ${totalSUMA + totalMISH + totalBlancos + totalNulos}
    </div>
  </div>

  <table class="results-table">
    <thead>
      <tr>
        <th>Mesa Electoral</th>
        <th style="text-align: right;">SUMA (H. Bermúdez)</th>
        <th style="text-align: right;">MISH (M. Corella)</th>
        <th style="text-align: right;">Votos en Blanco</th>
        <th style="text-align: right;">Votos Nulos</th>
        <th style="text-align: right;">No Utilizadas</th>
        <th style="text-align: right;">Padrón Electoral</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
      <tr class="total-row">
        <td>TOTAL CONSOLIDADO</td>
        <td style="text-align: right; color: #086788;">${totalSUMA}</td>
        <td style="text-align: right; color: #cc5200;">${totalMISH}</td>
        <td style="text-align: right;">${totalBlancos}</td>
        <td style="text-align: right;">${totalNulos}</td>
        <td style="text-align: right; color: #475569;">${totalNoUso}</td>
        <td style="text-align: right;">${totalPadrón}</td>
      </tr>
    </tbody>
  </table>

  <div class="incidents-box">
    <div class="incidents-title">Consolidado General de Incidencias por Mesa</div>
    ${incidentsHTML}
  </div>

  <div class="signatures-title">Firmas de Conformidad del Tribunal Electoral Estudiantil (TEE)</div>
  
  <div class="signatures-grid">
    <div class="signature-line">
      <span>Magistrado Presidente</span>
    </div>
    <div class="signature-line">
      <span>Magistrado Secretario</span>
    </div>
    <div class="signature-line">
      <span>Magistrado Vocal 1</span>
    </div>
  </div>
  <div class="signatures-grid-bottom">
    <div class="signature-line" style="width: 30%;">
      <span>Magistrado Vocal 2</span>
    </div>
    <div class="signature-line" style="width: 30%;">
      <span>Magistrado Vocal 3</span>
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

      {/* Luces decorativas */}
      <div className="absolute top-10 right-10 w-[300px] h-[300px] rounded-full bg-[#06b6d4]/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[250px] h-[250px] rounded-full bg-[#FF8200]/10 blur-[75px] pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-10 pb-5 border-b border-white/20">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <img
            src="/assets/tee.png"
            alt="TEE Logo"
            className="w-14 h-14 object-contain drop-shadow-[0_2px_5px_rgba(255,255,255,0.1)] animate-float"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display uppercase leading-tight text-glow-cyan">
              Tribunal Electoral Estudiantil Calasanz 2026
            </h1>
            <p className="text-xs text-[#FF8200] tracking-widest uppercase font-bold mt-1">
              Consola Máster de Monitoreo y Decisiones
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <img
            src="/assets/logocala.jpg"
            alt="Calasanz Escudo"
            className="w-10 h-10 object-contain rounded-lg border border-white/20 bg-white p-0.5 shadow-sm animate-pulse-glow"
          />
          {isInitialized && (
            <button
              onClick={() => {
                setShowResetConfirmModal(true);
                setResetConfirmInput('');
                setResetConfirmError('');
              }}
              className="flex items-center space-x-2 py-2 px-4 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 border border-white/20 active:scale-[0.97] transition-all cursor-pointer text-sm font-semibold bg-white/5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          )}

          <button
            onClick={logout}
            className="flex items-center space-x-2 py-2 px-4 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 border border-white/20 active:scale-[0.97] transition-all cursor-pointer text-sm font-semibold bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-grow space-y-10">

        {!isInitialized ? (
          /* PANTALLA DE INICIALIZACIÓN */
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#06b6d4] to-[#FF8200]" />

            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-[#06b6d4]" />
              <h2 className="text-2xl font-black text-slate-800 uppercase">Inicialización del Proceso</h2>
            </div>
            <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
              Configura los parámetros globales de la elección estudiantil antes de habilitar las terminales de las mesas de votación.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Formulario Configuración General */}
              <div className="space-y-6 md:pr-6 md:border-r border-slate-200/85">
                <h3 className="text-base font-bold text-cyan-600 uppercase tracking-wider">Padrón Electoral</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Número de Mesas Activas</label>
                  <select
                    value={activeTables}
                    onChange={(e) => setActiveTables(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:border-[#06b6d4] cursor-pointer shadow-sm font-bold"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Mesa' : 'Mesas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-slate-200/50">
                  <h4 className="text-xs font-bold text-[#0A467A] uppercase tracking-wider">
                    Cantidad de Votantes por Mesa
                  </h4>
                  {[...Array(activeTables)].map((_, idx) => {
                    const id = idx + 1;
                    const key = `table_${id}`;
                    return (
                      <div key={id} className="flex flex-col space-y-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">
                          Mesa {id} (Padrón)
                        </label>
                        <input
                          type="text"
                          value={padronesConfig[key] || '250'}
                          onChange={(e) => handlePadronChange(key, e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#06b6d4] shadow-sm font-semibold"
                          placeholder="250"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200/60 text-xs text-slate-800 space-y-2">
                  <Sparkles className="w-5 h-5 text-cyan-600 mb-1" />
                  <p><strong>Configuración Lista:</strong> Las mesas no contempladas dentro del rango seleccionado quedarán inactivas y deshabilitadas en la red.</p>
                </div>
              </div>

              {/* Formulario SUMA */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#06b6d4] uppercase tracking-wider">Partido SUMA (Cyan)</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Partido</label>
                    <input
                      type="text"
                      placeholder="Nombre del Partido"
                      value={sumaName}
                      onChange={(e) => setSumaName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-cyan-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Presidente</label>
                    <input
                      type="text"
                      placeholder="Nombre del Presidente"
                      value={sumaPres}
                      onChange={(e) => setSumaPres(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-cyan-500 shadow-sm"
                    />
                  </div>

                  {/* Carga de Bandera */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bandera del Partido</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {sumaFlag ? (
                        <img src={sumaFlag} alt="Bandera SUMA" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg text-xs font-bold cursor-pointer transition-all border border-cyan-150 text-center">
                        <span>Cargar Bandera</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSumaFlag)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Carga de Mascota */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mascota del Partido</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {sumaMascot ? (
                        <img src={sumaMascot} alt="Mascota SUMA" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg text-xs font-bold cursor-pointer transition-all border border-cyan-150 text-center">
                        <span>Cargar Mascota</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSumaMascot)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Carga de Foto de Presidente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fotografía del Presidente</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {sumaPresPhoto ? (
                        <img src={sumaPresPhoto} alt="Presidente SUMA" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg text-xs font-bold cursor-pointer transition-all border border-cyan-150 text-center">
                        <span>Cargar Fotografía</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSumaPresPhoto)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario MISH */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#FF8200] uppercase tracking-wider">Movimiento MISH (Naranja)</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Partido</label>
                    <input
                      type="text"
                      placeholder="Nombre del Partido"
                      value={mishName}
                      onChange={(e) => setMishName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Presidente</label>
                    <input
                      type="text"
                      placeholder="Nombre del Presidente"
                      value={mishPres}
                      onChange={(e) => setMishPres(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>

                  {/* Carga de Bandera */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bandera del Partido</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {mishFlag ? (
                        <img src={mishFlag} alt="Bandera MISH" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-orange-50 hover:bg-orange-100 text-[#FF8200] rounded-lg text-xs font-bold cursor-pointer transition-all border border-orange-150 text-center">
                        <span>Cargar Bandera</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setMishFlag)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Carga de Mascota */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mascota del Partido</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {mishMascot ? (
                        <img src={mishMascot} alt="Mascota MISH" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-orange-50 hover:bg-orange-100 text-[#FF8200] rounded-lg text-xs font-bold cursor-pointer transition-all border border-orange-150 text-center">
                        <span>Cargar Mascota</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setMishMascot)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Carga de Foto de Presidente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fotografía del Presidente</label>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      {mishPresPhoto ? (
                        <img src={mishPresPhoto} alt="Presidente MISH" className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                      )}
                      <label className="flex-grow flex items-center justify-center py-2 px-3 bg-orange-50 hover:bg-orange-100 text-[#FF8200] rounded-lg text-xs font-bold cursor-pointer transition-all border border-orange-150 text-center">
                        <span>Cargar Fotografía</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setMishPresPhoto)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-10 pt-6 border-t border-slate-200/85 flex justify-end">
              <button
                onClick={handleInitialize}
                className="py-3.5 px-8 rounded-xl font-bold text-white bg-gradient-to-r from-[#06b6d4] to-[#FF8200] hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all duration-300 flex items-center space-x-2 cursor-pointer text-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Iniciar Proceso Electoral</span>
              </button>
            </div>
          </div>
        ) : (
          /* CONSOLA DE MONITOREO DEL TRIBUNAL */
          <div className="space-y-10 animate-fade-in">

            {/* Panel Superior de Control de Cierre */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

              {/* Bloque Monitoreo de LEDs y Mesas */}
              <div className="glass-panel p-6 rounded-3xl md:col-span-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    <span>Conexión de Terminales Electorales</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {[...Array(activeTablesCount)].map((_, index) => {
                      const id = index + 1;
                      const key = `table_${id}`;
                      const table = tables[key] || { ingresado: false, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0 };
                      const padronVotes = table.padron || 250;

                      return (
                        <div
                          key={id}
                          className="glass-card p-4 rounded-2xl flex flex-col items-center justify-between border-slate-200/80 bg-white/40 relative shadow-sm"
                        >
                          <span className="text-[10px] text-slate-800 uppercase font-black tracking-widest mb-2">Mesa {id}</span>

                          {/* LED de estado */}
                          <div className={`w-3.5 h-3.5 rounded-full mb-3 ${table.ingresado ? 'bg-emerald-500 led-active' : 'bg-orange-500 led-pending animate-pulse'}`} />

                          <span className={`text-[10px] font-black ${table.ingresado ? 'text-emerald-800' : 'text-orange-700'}`}>
                            {table.ingresado ? 'INGRESADO' : 'PENDIENTE'}
                          </span>

                          {/* Botón de Revelación (Solo visible si está ingresada la mesa) */}
                          {table.ingresado && (
                            <button
                              onClick={() => {
                                socket?.emit('toggle_revealed', { key, value: !(electionData?.revealed?.tables?.[key]) });
                              }}
                              className={`mt-1.5 p-1 rounded-lg border transition-all cursor-pointer ${electionData?.revealed?.tables?.[key]
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                }`}
                              title={electionData?.revealed?.tables?.[key] ? 'Ocultar votos al público' : 'Revelar votos al público'}
                            >
                              <div className="flex items-center space-x-1 text-[8px] font-black uppercase tracking-wider px-1">
                                {electionData?.revealed?.tables?.[key] ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                    <span>Público</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-orange-600" />
                                    <span>Oculto</span>
                                  </>
                                )}
                              </div>
                            </button>
                          )}

                          {/* Padrón electoral de la mesa */}
                          <div className="text-[9px] text-slate-800 mt-2.5 font-bold bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300/40">
                            Padrón: {padronVotes} votos
                          </div>

                          {/* Botón de Impresión de Acta de Mesa */}
                          {table.ingresado && (
                            <button
                              onClick={() => generateMesaPDF(id, table)}
                              className="mt-2 w-full py-1.5 px-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer flex items-center justify-center space-x-1 text-[9px] font-black uppercase tracking-wider"
                              title="Imprimir Acta Oficial de Mesa"
                            >
                              <Printer className="w-3 h-3 shrink-0" />
                              <span>Acta</span>
                            </button>
                          )}

                          {/* Mini desglose de votos */}
                          {table.ingresado && (
                            <div className="text-[9px] text-slate-800 mt-3 pt-2 border-t border-slate-200 w-full text-center space-y-0.5 font-semibold">
                              {electionData?.revealed?.tables?.[key] ? (
                                <>
                                  <div>SUMA: <strong className="text-cyan-800 font-extrabold">{table.suma}</strong></div>
                                  <div>MISH: <strong className="text-[#FF8200] font-extrabold">{table.mish}</strong></div>
                                  <div>BLANCOS: <strong className="text-amber-800 font-extrabold">{table.blancos}</strong></div>
                                  <div>NULOS: <strong className="text-rose-800 font-extrabold">{table.nulos}</strong></div>
                                  <div>NO UT.: <strong className="text-slate-500 font-extrabold">{table.noUso || 0}</strong></div>
                                  <div className="text-[8px] text-emerald-800 font-black mt-1 uppercase tracking-wider">
                                    Participación: {(((table.suma + table.mish + table.blancos + table.nulos) / padronVotes) * 100).toFixed(0)}%
                                  </div>
                                </>
                              ) : (
                                <div className="py-2 flex flex-col items-center justify-center space-y-1">
                                  <EyeOff className="w-4.5 h-4.5 text-orange-600 animate-pulse" />
                                  <span className="text-[8px] text-orange-700 font-bold uppercase tracking-wider">Votos Ocultos</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 led-active block" />
                    <span>Transmisión en tiempo real activa</span>
                  </div>
                  <div className="mt-2 sm:mt-0 font-black text-[#0A467A]">
                    Padrón Activo: {activePadrónTotal} Votos • Participación Real: {globalParticipation.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Botón de Cierre de Escrutinio o Generar Acta Final */}
              <div className={`glass-panel p-6 rounded-3xl flex flex-col justify-between items-center text-center ${electionData?.electionClosed ? 'bg-emerald-500/5 border-emerald-200' : 'bg-rose-500/5 border-rose-200'}`}>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${electionData?.electionClosed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>

                <div className="my-4">
                  <h4 className="text-base font-extrabold text-slate-800">
                    {electionData?.electionClosed ? 'Escrutinio Cerrado' : 'Cierre de Conteo'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto leading-relaxed">
                    {electionData?.electionClosed
                      ? 'El proceso electoral ha finalizado de forma definitiva. Genera el acta consolidada oficial.'
                      : 'Detiene la entrada de datos en las mesas de forma permanente y proyecta la pantalla de victoria.'}
                  </p>
                </div>

                {electionData?.electionClosed ? (
                  <button
                    onClick={generateConsolidatedPDF}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer text-sm flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Acta Final TEE</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:shadow-lg hover:shadow-rose-500/10 active:scale-[0.98] transition-all cursor-pointer text-sm"
                  >
                    Finalizar Conteo
                  </button>
                )}
              </div>

            </div>

            {/* Panel de Toggles de Control de Gráficos */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/70">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-[#06b6d4]" />
                <div>
                  <h4 className="text-base font-bold text-slate-800">Controles de Visualización Pública</h4>
                  <p className="text-xs text-slate-500 font-medium">Usa los controles para develar o suspender en tiempo real los resultados al público.</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                {/* Toggle Métricas Generales */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => socket?.emit('toggle_revealed', { key: 'metrics', value: !showMetrics })}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${showMetrics
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/20'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-600 hover:bg-orange-500/20'
                      }`}
                    title={showMetrics ? 'Ocultar Métricas Generales' : 'Develar Métricas Generales'}
                  >
                    {showMetrics ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Métricas</span>
                </div>

                {/* Toggle Gráfico Válidos */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => socket?.emit('toggle_revealed', { key: 'validosChart', value: !showValidosChart })}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${showValidosChart
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/20'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-600 hover:bg-orange-500/20'
                      }`}
                    title={showValidosChart ? 'Ocultar Torta Votos Válidos' : 'Develar Torta Votos Válidos'}
                  >
                    {showValidosChart ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Torta Válidos</span>
                </div>

                {/* Toggle Gráfico Global */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => socket?.emit('toggle_revealed', { key: 'globalesChart', value: !showGlobalesChart })}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${showGlobalesChart
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/20'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-600 hover:bg-orange-500/20'
                      }`}
                    title={showGlobalesChart ? 'Ocultar Torta Global' : 'Develar Torta Global'}
                  >
                    {showGlobalesChart ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Torta Global</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE RENDERIZACIÓN DE GRÁFICOS */}
            <Visualizations
              metrics={metrics}
              parties={partiesConfig}
              toggles={{
                showValidosChart,
                showGlobalesChart,
                showMetrics
              }}
            />

          </div>
        )}

      </main>

      {/* MODAL DE SEGURIDAD PARA CIERRE DEFINITIVO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">

          <div className="glass-panel w-full max-w-md p-7 rounded-3xl shadow-2xl relative overflow-hidden border-rose-200 bg-white">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-rose-500" />

            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-lg font-black uppercase tracking-wide font-display">Confirmación Requerida</h3>
            </div>

            <p className="text-xs text-slate-650 leading-relaxed mb-6 font-semibold">
              Estás a punto de congelar de forma irreversible las elecciones estudiantiles 2026. Esta acción cerrará permanentemente las sesiones activas en las mesas e impedirá modificar datos.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Escribe la palabra clave <strong className="text-rose-600">"FINALIZAR"</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => {
                    setConfirmInput(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-rose-500 rounded-xl px-4 py-3 text-slate-800 font-mono uppercase tracking-widest text-center text-sm focus:outline-none shadow-inner"
                  placeholder="PALABRA CLAVE"
                />
              </div>

              {confirmError && (
                <div className="text-[11px] font-bold text-rose-600 text-center animate-shake">
                  {confirmError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmInput('');
                    setConfirmError('');
                  }}
                  className="py-3.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalize}
                  className="py-3.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 hover:shadow-md hover:shadow-rose-500/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Sí, Finalizar Escrutinio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SEGURIDAD PARA REINICIAR PROCESO */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-7 rounded-3xl shadow-2xl relative overflow-hidden border-orange-200 bg-white">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500" />

            <div className="flex items-center space-x-3 text-orange-600 mb-4">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-lg font-black uppercase tracking-wide font-display">Reiniciar Proceso</h3>
            </div>

            <p className="text-xs text-slate-650 leading-relaxed mb-6 font-semibold">
              ¿Está completamente seguro de que desea reiniciar todo el proceso electoral? Se borrarán todos los datos ingresados en las mesas y se regresará a la pantalla de configuración inicial. Esta acción no se puede deshacer.
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
                  className="w-full bg-slate-50 border border-slate-250 focus:border-orange-500 rounded-xl px-4 py-3 text-slate-800 font-mono uppercase tracking-widest text-center text-sm focus:outline-none shadow-inner animate-fade-in"
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

      <footer className="mt-16 text-center text-xs text-slate-350 relative z-10 font-semibold">
        Escrutinio 2026 • Tribunal Electoral Máster Autorizado • Protocolo SSL/WebSocket Activo
      </footer>
    </div>
  );
};
