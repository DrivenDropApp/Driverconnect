import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const API_URL = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, ''); // Remove /api/v1 from the end of the URL

export function getDriverSocket(token: string): Socket {
  if (socket?.connected) return socket;

  const url = SOCKET_URL ? `${SOCKET_URL}/driver` : '/driver';

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Driver socket connected');
    socket?.emit('join:active'); // Rejoin active trip room on reconnect
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Driver socket disconnected:', reason);
  });

  return socket;
}

export function disconnectDriverSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket as driverSocket };
