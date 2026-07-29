import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getDriverSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io('/driver', {
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
