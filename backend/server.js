const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();

const analysisRoutes = require('./routes/analysis');
const historyRoutes = require('./routes/history');
const authRoutes = require('./routes/auth');
const { initSocket } = require('./socket/socket');
const { initializeDatabase } = require('./database/db');

const app = express();
const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);

initSocket(server);

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'AI Cloud Cost Detective backend is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', analysisRoutes);
app.use('/api', historyRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

async function startServer() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }

  server.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;