const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const analysisRoutes = require('./routes/analysis');

const app = express();
const port = Number(process.env.PORT || 5000);

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

app.use('/api', analysisRoutes);

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
  });
}

module.exports = app;