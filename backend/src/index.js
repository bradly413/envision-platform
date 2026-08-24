require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const portalRoutes = require('./routes/portals');
const taskRoutes = require('./routes/tasks');
const calendarRoutes = require('./routes/calendar');
const financeRoutes = require('./routes/finance');
const agentRoutes = require('./routes/agents');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const designSystemRoutes = require('./routes/designSystems');
const scrapeRoutes = require('./routes/scrape');
const portalAiRoutes = require('./routes/portalAi');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// CORS — admin dashboard + client portal
const allowedOrigins = [process.env.ADMIN_URL, process.env.PORTAL_URL].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// Security
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/portals',   portalRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/calendar',  calendarRoutes);
app.use('/api/finance',   financeRoutes);
app.use('/api/agents',    agentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/design-systems', designSystemRoutes);
app.use('/api/scrape',         scrapeRoutes);
app.use('/api/portals',        portalAiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const db = require('./config/db');

async function start() {
  await db.ensureSchema();
  app.listen(PORT, () => console.log(`Envision backend running on port ${PORT}`));
}

start();
module.exports = app;
// redeploy Thu Mar 26 23:13:22 UTC 2026
