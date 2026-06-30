import express from 'express';
import { config } from './config/env.js';
import webhookRouter from './routes/webhook.js';
import apiRouter from './routes/api.js';

const app = express();

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', webhookRouter); // Webhook route
app.use('/api', express.json(), apiRouter); // API routes

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 CodeReview.ai Server running on port ${PORT}`);
  console.log(`📝 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use!`);
    console.error(`   Run: taskkill /F /IM node.exe`);
    console.error(`   Then restart: npm run dev`);
    process.exit(1);
  }
});
