require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const settingsRouter = require("./routes/settings");
const cors = require('cors');

const { router: authRouter, authenticateToken } = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const mapRouter = require('./routes/map');
const incidentsRouter = require('./routes/incidents');
const polesRouter = require('./routes/poles');
const telemetryRouter = require('./routes/telemetry');
const simulatorRouter = require('./routes/simulator');
const assetsRouter = require('./routes/assets');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);


// Middleware
app.set('trust proxy', 1);
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Liveness/readiness endpoint used by Docker and the Jenkins smoke test.
app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    service: 'gridsense-api',
    database: databaseReady ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Public Routes
app.use('/api/auth', authRouter);

// Protected Routes
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/map', authenticateToken, mapRouter);
app.use('/api/incidents', authenticateToken, incidentsRouter);
app.use('/api/poles', authenticateToken, polesRouter);
app.use('/api/telemetry', authenticateToken, telemetryRouter);
app.use('/api/simulator', authenticateToken, simulatorRouter);
app.use('/api/assets', authenticateToken, assetsRouter);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/settings", authenticateToken, settingsRouter);


// Socket Connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database and Server Activation
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gridsense-ai';

async function startServer() {
  if (process.env.NODE_ENV === 'test') return;

  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`GridSense AI backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}
startServer();

module.exports = { app, server, io };
