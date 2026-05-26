import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  loadStore,
  getConsolidatedData,
  initializeElectionConfig,
  updateTableData,
  updateTableIncidents,
  finalizeElection,
  resetElection,
  toggleRevealed
} from './election_store.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecure-election-secret-key-2026-dynamic';

// Cargar estado persistido
loadStore();

// Middlewares estándar
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const CREDENTIALS_RAW = {
  master: (process.env.MASTER_PASSWORD || 'Tribunal2026!Master').replace(/\r$/, '').trim(),
  table_1: (process.env.TABLE1_PASSWORD || 'Mesa1#SumaMish').replace(/\r$/, '').trim(),
  table_2: (process.env.TABLE2_PASSWORD || 'Mesa2#SumaMish').replace(/\r$/, '').trim(),
  table_3: (process.env.TABLE3_PASSWORD || 'Mesa3#SumaMish').replace(/\r$/, '').trim(),
  table_4: (process.env.TABLE4_PASSWORD || 'Mesa4#SumaMish').replace(/\r$/, '').trim(),
  table_5: (process.env.TABLE5_PASSWORD || 'Mesa5#SumaMish').replace(/\r$/, '').trim()
};

// Generar hashes dinámicamente con bcrypt en el primer arranque si no están pre-hasheados
const HASHS = {};
Object.entries(CREDENTIALS_RAW).forEach(([role, pass]) => {
  if (pass.startsWith('$2a$') || pass.startsWith('$2b$') || pass.startsWith('$2y$')) {
    HASHS[role] = pass;
    console.log(`🔒 Usando hash de Bcrypt pre-configurado para el rol: [${role}]`);
  } else {
    HASHS[role] = bcrypt.hashSync(pass, 10);
    console.log(`🔒 Clave [${role}] -> Original: "${pass}", Hash: "${HASHS[role]}"`);
  }
});

// Middleware de autenticación para endpoints API
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: Token faltante.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
  }
};

// --- ENDPOINTS DE API ---

// Pasarela de Login Única
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Se requiere la contraseña de acceso.' });
  }

  const cleanPassword = password.trim();
  console.log(`🔑 [LOGIN DIAGNOSTIC] Recibida contraseña limpia: "${cleanPassword}"`);

  // Comprobar coincidencia criptográfica contra los hashes de Bcrypt
  const role = Object.keys(HASHS).find(key => {
    const isMatch = bcrypt.compareSync(cleanPassword, HASHS[key]);
    console.log(`   -> Probando rol [${key}]: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    return isMatch;
  });

  if (!role) {
    console.log(`❌ [LOGIN DIAGNOSTIC] La contraseña "${cleanPassword}" no coincide con ningún rol.`);
    return res.status(401).json({ error: 'Credencial inválida. Acceso rechazado.' });
  }

  console.log(`✅ [LOGIN DIAGNOSTIC] Acceso concedido para rol [${role}]`);

  // Generar JWT firmado
  const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '12h' });

  // Poner el token en una cookie HttpOnly segura
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 horas
  });

  return res.json({
    success: true,
    token,
    role,
    label: role === 'master' ? 'Magistrado Máster' : `Operador de Mesa ${role.split('_')[1]}`
  });
});

// Obtener perfil activo
app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({
    role: req.user.role,
    label: req.user.role === 'master' ? 'Magistrado Máster' : `Operador de Mesa ${req.user.role.split('_')[1]}`
  });
});

// Cerrar sesión
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Sesión cerrada.' });
});

// Obtener datos iniciales de la elección
app.get('/api/election/data', authenticateToken, (req, res) => {
  return res.json(getConsolidatedData());
});

// Reiniciar proceso de elección (Sólo Máster)
app.post('/api/election/reset', authenticateToken, (req, res) => {
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Denegado: Solo el tribunal máster puede reiniciar.' });
  }
  const cleanData = resetElection();
  io.emit('data_updated', cleanData);
  return res.json({ success: true, data: cleanData });
});


// --- MIDDLEWARE CRÍTICO DE SEGURIDAD LOCAL PARA RUTA ESTÁTICAS ---
// Si un usuario escribe directamente la dirección de las vistas protegidas en el navegador,
// el servidor intercepta, valida el token, y si no es válido, redirige a '/' (Login).
const clientBuildPath = path.resolve('../client/dist');

app.get(['/master', '/mesa/:id'], (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/');
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    const url = req.path;

    if (url.startsWith('/master') && verified.role !== 'master') {
      return res.redirect('/');
    }

    if (url.startsWith('/mesa/')) {
      const mesaNum = url.split('/').pop();
      const targetTable = `table_${mesaNum}`;
      if (verified.role !== 'master' && verified.role !== targetTable) {
        return res.redirect('/');
      }
    }

    next(); // Token y rol correctos, servir la aplicación React
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/');
  }
});


// --- CONFIGURACIÓN DE WEBSOCKETS (SOCKET.IO) ---
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  }
});

// Middleware de autenticación de Socket.io mediante cookies del handshake
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  let token = socket.handshake.auth?.token;

  if (!token && cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [k, v] = c.split('=');
        return [k, decodeURIComponent(v)];
      })
    );
    token = cookies.token;
  }

  if (!token) {
    return next(new Error('Acceso denegado: Token ausente.'));
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    socket.user = verified;
    next();
  } catch (err) {
    next(new Error('Acceso denegado: Token inválido.'));
  }
});

io.on('connection', (socket) => {
  const role = socket.user.role;
  console.log(`🔌 Cliente WebSocket conectado: ${role} [SocketID: ${socket.id}]`);

  // Enviar datos consolidados actuales en el momento de conectar
  socket.emit('data_updated', getConsolidatedData());

  // Evento: Inicializar configuración electoral (Solo Máster)
  socket.on('initialize_election', (configPayload) => {
    try {
      if (role !== 'master') {
        return socket.emit('error_message', 'Operación exclusiva para el Tribunal Máster.');
      }
      const updatedStore = initializeElectionConfig(configPayload);
      io.emit('data_updated', updatedStore);
      console.log('⚙️ Elección inicializada con éxito por el Tribunal Máster.');
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Evento: Alternar revelación de datos (Solo Máster)
  socket.on('toggle_revealed', (payload) => {
    try {
      if (role !== 'master') {
        return socket.emit('error_message', 'Operación exclusiva para el Tribunal Máster.');
      }
      const { key, value } = payload;
      const updatedStore = toggleRevealed(key, value);
      io.emit('data_updated', updatedStore);
      console.log(`👁️ Revelación cambiada: [${key}] -> ${value}`);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Evento: Mesa guarda o actualiza datos
  socket.on('update_table_data', (payload) => {
    try {
      const { tableId, data } = payload;

      // VALIDACIÓN CRUZADA: Evitar que una sesión de mesa edite datos de otra mesa
      if (role !== 'master' && role !== tableId) {
        return socket.emit('error_message', 'Acción denegada: No posees permisos para modificar esta mesa.');
      }

      const updatedStore = updateTableData(tableId, data);
      io.emit('data_updated', updatedStore);
      console.log(`📈 Datos de la mesa [${tableId}] actualizados por [${role}]`);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Evento: Mesa guarda o actualiza incidencias
  socket.on('update_table_incidents', (payload) => {
    try {
      const { tableId, incidencias } = payload;

      // VALIDACIÓN CRUZADA: Evitar que una sesión de mesa edite datos de otra mesa
      if (role !== 'master' && role !== tableId) {
        return socket.emit('error_message', 'Acción denegada: No posees permisos para modificar esta mesa.');
      }

      const updatedStore = updateTableIncidents(tableId, incidencias);
      io.emit('data_updated', updatedStore);
      console.log(`📈 Incidencias de la mesa [${tableId}] actualizadas por [${role}]`);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Evento: Cierre definitivo del escrutinio (Solo Máster)
  socket.on('finalize_election', () => {
    try {
      if (role !== 'master') {
        return socket.emit('error_message', 'Acción exclusiva para el Tribunal Máster.');
      }
      const closedStore = finalizeElection();
      io.emit('data_updated', closedStore);
      io.emit('election_closed');
      console.log('🔒 Escrutinio finalizado. Conteo y mesas congeladas.');
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente WebSocket desconectado: ${role} [SocketID: ${socket.id}]`);
  });
});

// Servir archivos estáticos del compilado de React
app.use(express.static(clientBuildPath));

// Cualquier otra ruta no capturada sirve el HTML de React (para soporte de enrutado en el cliente)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Iniciar servidor local
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose de forma segura en:`);
  console.log(`   - Localhost: http://localhost:${PORT}`);
  console.log(`   - Red Local: http://0.0.0.0:${PORT} (permite acceso de otras IPs locales)`);
});
