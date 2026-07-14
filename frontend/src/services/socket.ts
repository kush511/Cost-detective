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

export function subscribeToProgressStatus(
  handlers: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onReconnect?: () => void;
  } = {}
) {
  const socket = getProgressSocket();

  if (handlers.onConnect) {
    socket.on('connect', handlers.onConnect);
  }

  if (handlers.onDisconnect) {
    socket.on('disconnect', handlers.onDisconnect);
  }

  if (handlers.onReconnect) {
    socket.io.on('reconnect', handlers.onReconnect);
  }

  return () => {
    if (handlers.onConnect) {
      socket.off('connect', handlers.onConnect);
    }

    if (handlers.onDisconnect) {
      socket.off('disconnect', handlers.onDisconnect);
    }

    if (handlers.onReconnect) {
      socket.io.off('reconnect', handlers.onReconnect);
    }
  };
}

export function connectProgressSocket() {
  const socket = getProgressSocket();
  socket.connect();
  return socket;
}

export function disconnectProgressSocket() {
  if (progressSocket) {
    progressSocket.disconnect();
  }
}