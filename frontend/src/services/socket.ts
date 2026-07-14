import { io, Socket } from 'socket.io-client';
import type { ProgressUpdate } from '../types';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let progressSocket: Socket | null = null;

function getProgressSocket() {
  if (!progressSocket) {
    progressSocket = io(`${socketUrl}/progress`, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return progressSocket;
}

export function subscribeToProgress(handler: (update: ProgressUpdate) => void) {
  const socket = getProgressSocket();
  socket.on('analysis:progress', handler);

  if (!socket.connected) {
    socket.connect();
  }

  return () => {
    socket.off('analysis:progress', handler);

    if (socket.listeners('analysis:progress').length === 0) {
      socket.disconnect();
    }
  };
}