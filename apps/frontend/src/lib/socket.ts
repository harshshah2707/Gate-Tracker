import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');

let socket: Socket | null = null;

export const getSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Realtime socket connected successfully:', socket?.id);
      if (userId) {
        socket?.emit('user:online', { userId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Realtime socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('Realtime socket connection error:', error);
    });
  }

  // If userId is provided and we just connected or need to re-verify status
  if (userId && socket.connected) {
    socket.emit('user:online', { userId });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Realtime socket disconnected manually');
  }
};
