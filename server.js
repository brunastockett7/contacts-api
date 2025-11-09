// server.js
const path = require('path');
// Load .env first
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors'); // ← optional, recommended
const db = require('./db/connect');
const contactsRoutes = require('./routes/contacts');
const { exec } = require('child_process');

const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger/swagger.json');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());
app.use(cors()); // ← optional, recommended

// Dev request log (place BEFORE routes to log requests)
if (!isProd) {
  app.use((req, _res, next) => {
    console.log('> Incoming:', req.method, req.url);
    next();
  });
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Health route (for quick checks and Render)
app.get('/', (_req, res) => res.json({ ok: true, docs: '/api-docs' }));

// Mount contacts routes (MVC)
app.use('/contacts', contactsRoutes);

// Helper: auto-open default browser locally
function openBrowser(url) {
  if (isProd) return; // never auto-open on Render
  const platform = process.platform;
  if (platform === 'win32') exec(`start "" "${url}"`);
  else if (platform === 'darwin') exec(`open "${url}"`);
  else exec(`xdg-open "${url}"`);
}

// Init DB first, then start server
db.initDb((err) => {
  if (err) {
    console.error('❌ Failed to init DB:', err);
    process.exit(1);
  }

  // Bind to localhost locally; let platform default in production (Render needs 0.0.0.0)
  const listenArgs = isProd ? [PORT] : [PORT, 'localhost'];

  app.listen(...listenArgs, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`🚀 Server listening on ${url}`);
    openBrowser(url);
  });
});

