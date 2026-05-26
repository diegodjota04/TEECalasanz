import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('election_data.json');

const defaultPartiesConfig = {
  SUMA: {
    name: 'Partido SUMA',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0891b2',
    flag: '/assets/suma_flag.png',
    mascot: '/assets/suma_mascot.png',
    presidentName: 'Helena Bermúdez',
    presidentPhoto: '/assets/suma_president.png'
  },
  MISH: {
    name: 'Movimiento MISH',
    color: '#FF8200', // Orange
    secondaryColor: '#EA580C',
    flag: '/assets/mish_flag.png',
    mascot: '/assets/mish_mascot.png',
    presidentName: 'Maximiliano Corella',
    presidentPhoto: '/assets/mish_president.png'
  }
};

const initialStore = {
  electionClosed: false,
  initialized: false,
  activeTablesCount: 5,
  partiesConfig: { ...defaultPartiesConfig },
  revealed: {
    metrics: false,
    validosChart: false,
    globalesChart: false,
    tables: {
      table_1: false,
      table_2: false,
      table_3: false,
      table_4: false,
      table_5: false
    }
  },
  tables: {
    table_1: { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0, ingresado: false, updatedAt: null },
    table_2: { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0, ingresado: false, updatedAt: null },
    table_3: { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0, ingresado: false, updatedAt: null },
    table_4: { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0, ingresado: false, updatedAt: null },
    table_5: { padron: 250, suma: 0, mish: 0, blancos: 0, nulos: 0, noUso: 0, ingresado: false, updatedAt: null },
  }
};

let store = { ...initialStore };

// Cargar tienda de datos desde archivo
export function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      // Fusión inteligente para mantener llaves nuevas si existen
      store = { ...initialStore, ...parsed };
      // Fusión profunda para revealed
      if (parsed.revealed) {
        store.revealed = { ...initialStore.revealed, ...parsed.revealed };
        if (parsed.revealed.tables) {
          store.revealed.tables = { ...initialStore.revealed.tables, ...parsed.revealed.tables };
        }
      }
      // Garantizar que todas las mesas cuenten con las llaves necesarias tras la fusión
      for (let i = 1; i <= 5; i++) {
        const key = `table_${i}`;
        if (store.tables[key]) {
          if (store.tables[key].padron === undefined) {
            store.tables[key].padron = 250;
          }
          if (store.tables[key].noUso === undefined) {
            store.tables[key].noUso = 0;
          }
        }
      }
      console.log('📂 Datos electorales persistidos cargados correctamente.');
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('❌ Error al cargar datos. Usando estado inicial.', err);
  }
}

// Guardar en disco
export function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Error al guardar datos en archivo:', err);
  }
}

// Obtener consolidado con métricas dinámicas
export function getConsolidatedData() {
  let votosSuma = 0;
  let votosMish = 0;
  let votosBlancos = 0;
  let votosNulos = 0;
  let votosNoUso = 0;
  let mesasIngresadasCount = 0;

  const totalMesasActivas = store.activeTablesCount;

  // Solo contabilizar mesas que estén dentro del límite activo
  for (let i = 1; i <= totalMesasActivas; i++) {
    const tableId = `table_${i}`;
    const table = store.tables[tableId];
    if (table && table.ingresado) {
      votosSuma += Number(table.suma) || 0;
      votosMish += Number(table.mish) || 0;
      votosBlancos += Number(table.blancos) || 0;
      votosNulos += Number(table.nulos) || 0;
      votosNoUso += Number(table.noUso) || 0;
      mesasIngresadasCount++;
    }
  }

  const votosTotales = votosSuma + votosMish + votosBlancos + votosNulos + votosNoUso;
  const votosValidos = votosSuma + votosMish;

  return {
    ...store,
    metrics: {
      votosSuma,
      votosMish,
      votosBlancos,
      votosNulos,
      votosNoUso,
      votosTotales,
      votosValidos,
      mesasIngresadasCount,
      totalMesasActivas,
      porcentajeParticipacion: totalMesasActivas > 0 ? (mesasIngresadasCount / totalMesasActivas) * 100 : 0
    }
  };
}

// Inicializar configuración del tribunal (Sólo Máster)
export function initializeElectionConfig(config) {
  const { activeTablesCount, partiesConfig, tablePadrones } = config;

  if (store.electionClosed) {
    throw new Error('La elección está cerrada. No se puede reinicializar.');
  }

  store.activeTablesCount = Math.min(5, Math.max(1, parseInt(activeTablesCount, 10) || 5));

  // Asignar padrón a cada mesa
  for (let i = 1; i <= 5; i++) {
    const key = `table_${i}`;
    if (store.tables[key]) {
      const padronVal = tablePadrones && tablePadrones[key] ? parseInt(tablePadrones[key], 10) : 250;
      store.tables[key].padron = padronVal || 250;
    }
  }

  // Todo oculto por defecto al inicializar
  store.revealed = {
    metrics: false,
    validosChart: false,
    globalesChart: false,
    tables: {
      table_1: false,
      table_2: false,
      table_3: false,
      table_4: false,
      table_5: false
    }
  };

  if (partiesConfig) {
    if (partiesConfig.SUMA) {
      store.partiesConfig.SUMA = { ...store.partiesConfig.SUMA, ...partiesConfig.SUMA };
    }
    if (partiesConfig.MISH) {
      store.partiesConfig.MISH = { ...store.partiesConfig.MISH, ...partiesConfig.MISH };
    }
  }

  store.initialized = true;
  saveStore();
  return getConsolidatedData();
}

// Actualizar datos de votos de una mesa
export function updateTableData(tableId, data) {
  if (store.electionClosed) {
    throw new Error('La elección ya está cerrada y bloqueada por el Tribunal Máster.');
  }

  const tableIndex = parseInt(tableId.split('_')[1], 10);
  if (tableIndex > store.activeTablesCount) {
    throw new Error(`Acceso no permitido: La ${tableId} está inactiva bajo la configuración actual.`);
  }

  if (!store.tables[tableId]) {
    throw new Error(`Mesa no válida: ${tableId}`);
  }

  // VALIDACIÓN: Si los datos ya han sido ingresados para esta mesa, bloquear modificaciones futuras.
  if (store.tables[tableId].ingresado) {
    throw new Error('Esta mesa ya ha sido ingresada y bloqueada para modificaciones.');
  }

  const { suma, mish, blancos, nulos, noUso } = data;

  const parsedSuma = Math.max(0, parseInt(suma, 10) || 0);
  const parsedMish = Math.max(0, parseInt(mish, 10) || 0);
  const parsedBlancos = Math.max(0, parseInt(blancos, 10) || 0);
  const parsedNulos = Math.max(0, parseInt(nulos, 10) || 0);
  const parsedNoUso = Math.max(0, parseInt(noUso, 10) || 0);

  const table = store.tables[tableId];
  const padronEsperado = table.padron || 250;
  const totalVotos = parsedSuma + parsedMish + parsedBlancos + parsedNulos + parsedNoUso;

  if (totalVotos !== padronEsperado) {
    throw new Error(`El total de votos ingresados (${totalVotos}) debe coincidir exactamente con el padrón electoral de la mesa (${padronEsperado}).`);
  }

  store.tables[tableId] = {
    padron: padronEsperado,
    suma: parsedSuma,
    mish: parsedMish,
    blancos: parsedBlancos,
    nulos: parsedNulos,
    noUso: parsedNoUso,
    ingresado: true,
    incidencias: store.tables[tableId]?.incidencias || '',
    updatedAt: new Date().toISOString()
  };

  saveStore();
  return getConsolidatedData();
}

// Actualizar incidencias de una mesa
export function updateTableIncidents(tableId, incidencias) {
  if (store.electionClosed) {
    throw new Error('La elección ya está cerrada y bloqueada por el Tribunal Máster.');
  }

  if (!store.tables[tableId]) {
    throw new Error(`Mesa no válida: ${tableId}`);
  }

  store.tables[tableId].incidencias = incidencias || '';
  saveStore();
  return getConsolidatedData();
}

// Cierre definitivo del escrutinio
export function finalizeElection() {
  store.electionClosed = true;
  saveStore();
  return getConsolidatedData();
}

// Reiniciar estado
export function resetElection() {
  store = JSON.parse(JSON.stringify(initialStore));
  saveStore();
  return getConsolidatedData();
}

// Alternar revelación de datos
export function toggleRevealed(key, value) {
  if (key.startsWith('table_')) {
    store.revealed.tables[key] = value === true;
  } else {
    store.revealed[key] = value === true;
  }
  saveStore();
  return getConsolidatedData();
}
