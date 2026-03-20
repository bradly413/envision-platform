const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const db = require('../config/db');

router.use(requireAdmin);

// Agency-level dashboard stats
router.get('/overview', async (req, res) => {
  try {
    const [clients, tasks, portals, revenue] = await Promise.all([
      db.query('SELECT stage, COUNT(*) as count FROM clients GROUP BY stage'),
      db.query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status"),
      db.query("SELECT status, COUNT(*) as count FROM portals GROUP BY status"),
      db.query("SELECT SUM(revenue) as total FROM clients WHERE stage NOT IN ('lead','archived')"),
    ]);
    res.json({
      clientsByStage: clients.rows,
      tasksByStatus: tasks.rows,
      portalsByStatus: portals.rows,
      totalRevenue: revenue.rows[0]?.total || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
