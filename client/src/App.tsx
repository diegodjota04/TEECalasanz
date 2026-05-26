import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { MasterDashboard } from './components/MasterDashboard';
import { TableForm } from './components/TableForm';
import { VictoryScreen } from './components/VictoryScreen';
import { io, Socket } from 'socket.io-client';
import { Loader2 } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [electionData, setElectionData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Conexión WebSockets al autenticar al usuario
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setLoadingData(true);
      return;
    }

    // Soporte de autenticación de cookies y token en sessionStorage para incógnito
    const token = sessionStorage.getItem('token');
    const socketInstance = io(window.location.origin, {
      auth: { token },
      withCredentials: true
    });

    setSocket(socketInstance);

    // Escuchar actualizaciones de datos en tiempo real
    socketInstance.on('data_updated', (data) => {
      setElectionData(data);
      setLoadingData(false);
    });

    // Escuchar el cierre definitivo de escrutinio
    socketInstance.on('election_closed', () => {
      // Opcional: Podríamos reproducir un sonido o vibración de celebración
      console.log('🔒 Escrutinio finalizado de forma oficial por el Máster.');
    });

    socketInstance.on('error_message', (msg) => {
      alert(`⚠️ Servidor: ${msg}`);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const handleResetElection = async () => {
    try {
      const response = await fetch('/api/election/reset', { method: 'POST' });
      if (response.ok) {
        const res = await response.json();
        setElectionData(res.data);
      }
    } catch (err) {
      console.error('Error al reiniciar elección:', err);
    }
  };

  // Cargando estados de sesión inicial
  if (authLoading || (isAuthenticated && loadingData)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0A467A] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#06b6d4] mb-4" />
        <p className="text-sm text-slate-200 font-medium tracking-wide">
          Estableciendo conexión en red local...
        </p>
      </div>
    );
  }

  // 1. Si no está autenticado -> Pasarela Única de Acceso
  if (!isAuthenticated || !user) {
    return <Login onSuccess={() => {}} />;
  }

  // 2. Si las elecciones se cerraron -> Victory Screen para todos
  if (electionData?.electionClosed) {
    return (
      <VictoryScreen 
        parties={electionData.partiesConfig}
        metrics={electionData.metrics}
        isMaster={user.role === 'master'}
        onReset={handleResetElection}
      />
    );
  }

  // 3. Enrutador seguro según el Rol del Token
  if (user.role === 'master') {
    return (
      <MasterDashboard 
        socket={socket} 
        electionData={electionData} 
        onReset={handleResetElection}
      />
    );
  } else if (user.role.startsWith('table_')) {
    return (
      <TableForm 
        socket={socket} 
        electionData={electionData} 
      />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A467A] text-white text-center p-6">
      <div>
        <h2 className="text-xl font-bold">Error de Rol de Acceso</h2>
        <p className="text-slate-200 mt-2">La sesión activa no cuenta con permisos correspondientes.</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default App;
