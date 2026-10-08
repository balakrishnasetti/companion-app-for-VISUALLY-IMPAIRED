require('dotenv').config();

const http = require('node:http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDatabase = require('./config/db');
const configureSockets = require('./sockets');

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a private random value of at least 32 characters.');
  }
  const connection = await connectDatabase();
  const server = http.createServer(app);
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    maxHttpBufferSize: 1e6,
  });
  app.set('io', io);
  configureSockets(io);
  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => console.log(`BALA API listening on port ${port}; MongoDB ${connection.readyState === 1 ? 'connected' : 'disconnected'}.`));

  const shutdown = async () => {
    io.close();
    server.close();
    await connection.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('BALA API could not start:', error.message);
  process.exitCode = 1;
});
