import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user) {
      setSocket(null);
      return undefined;
    }
    const connection = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 8,
    });
    setSocket(connection);
    return () => {
      connection.disconnect();
      setSocket(null);
    };
  }, [user?.id]);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
