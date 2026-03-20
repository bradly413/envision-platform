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
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.set("trust proxy", 1);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// CORS — admin dashboard + client portal
app.use(cors({
  origin: [process.env.ADMIN_URL, process.env.PORTAL_URL],
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/portals',   portalRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/calendar',  calendarRoutes);
app.use('/api/finance',   financeRoutes);
app.use('/api/agents',    agentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads',   uploadRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => console.log(`Envision backend running on port ${PORT}`));
module.exports = app;

