// server.js
const path = require('path');
// Load .env first
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const db = require('./db/connect');
const contactsRoutes = require('./routes/contacts');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());

// Health route (for quick checks and Render)
app.get('/', (_req, res) => res.send('Hello World!'));

// Mount contacts routes (MVC)
app.use('/contacts', contactsRoutes);

// Optional request log (helpful locally)
if (!isProd) {
  app.use((req, _res, next) => {
    console.log('> Incoming:', req.method, req.url);
    next();
  });
}

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
  const listenArgs = isProd
    ? [PORT]
    : [PORT, 'localhost'];

  app.listen(...listenArgs, () => {
    // This prints a clickable URL in VS Code/most terminals
    const url = `http://localhost:${PORT}`;
    console.log(`🚀 Server listening on ${url}`);
    openBrowser(url); // auto-opens Chrome/your default browser locally
  });
});
