const { Server } = require('socket.io');

let ioInstance = null;
let progressNamespace = null;

function initSocket(server) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  progressNamespace = ioInstance.of('/progress');

  progressNamespace.on('connection', (socket) => {
    socket.on('join:analysis', (analysisId) => {
      if (analysisId) {
        socket.join(analysisId);
      }
    });
  });

  return ioInstance;
}

function emitProgress(payload) {
  if (!progressNamespace) {
    return;
  }

  progressNamespace.emit('analysis:progress', payload);

  if (payload?.analysisId) {
    progressNamespace.to(payload.analysisId).emit('analysis:progress', payload);
  }
}

function emitProgressStep(analysisId, step, progress) {
  emitProgress({ analysisId, step, progress });
}

module.exports = {
  initSocket,
  emitProgress,
  emitProgressStep,
};