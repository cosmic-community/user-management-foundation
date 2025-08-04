const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Import routes
const cmsRoutes = require('./src/server/routes/cms');
const reloadRoutes = require('./src/server/routes/reload');

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const RELOAD_PORT = process.env.RELOAD_PORT || 8098;

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", `ws://localhost:${RELOAD_PORT}`]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'src/client')));

// API routes
app.use('/api/cms', cmsRoutes);
app.use('/api', reloadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    reloadPort: RELOAD_PORT
  });
});

// Serve the main HTML file for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/client/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Check for Chrome extension runtime errors
  if (err.message && err.message.includes('runtime.lastError')) {
    console.log('Chrome extension error handled:', err.message);
    return res.status(200).json({ status: 'handled', error: 'extension_error' });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 CMS API Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'src/client')}`);
});

// WebSocket Server for live-reload
const wss = new WebSocket.Server({ 
  port: RELOAD_PORT,
  perMessageDeflate: false
});

const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const clientIP = req.socket.remoteAddress;
  
  console.log(`🔌 WebSocket client connected: ${clientId} from ${clientIP}`);
  
  clients.set(clientId, {
    ws,
    id: clientId,
    connectedAt: new Date(),
    ip: clientIP
  });

  // Send welcome message
  try {
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Message from ${clientId}:`, data);
      
      // Echo back for testing or handle specific message types
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket client disconnected: ${clientId} (${code})`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for client ${clientId}:`, error);
    clients.delete(clientId);
  });
});

console.log(`🔄 WebSocket live-reload server running on ws://localhost:${RELOAD_PORT}`);

// Export broadcast function for reload endpoint
global.broadcastReload = (data = {}) => {
  const message = JSON.stringify({
    type: 'reload',
    message: 'Code changes detected, reloading...',
    timestamp: new Date().toISOString(),
    ...data
  });

  let successCount = 0;
  let errorCount = 0;

  clients.forEach((client, clientId) => {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
        successCount++;
      } else {
        clients.delete(clientId);
      }
    } catch (error) {
      console.error(`Error broadcasting to client ${clientId}:`, error);
      clients.delete(clientId);
      errorCount++;
    }
  });

  console.log(`📡 Broadcast reload to ${successCount} clients (${errorCount} errors)`);
  return { successCount, errorCount, totalClients: clients.size };
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    wss.close(() => {
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    wss.close(() => {
      process.exit(0);
    });
  });
});