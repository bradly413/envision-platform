const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const db = require('../config/db');

router.use(requireAdmin);

// GET all clients
router.get('/', async (req, res) => {
  try {
    const { stage, search } = req.query;
    let query = 'SELECT c.*, COUNT(t.id) FILTER (WHERE t.status != $1) as open_tasks, COUNT(p.id) as portals FROM clients c LEFT JOIN tasks t ON t.client_id = c.id LEFT JOIN portals p ON p.client_id = c.id';
    const params = ['done'];
    const conditions = [];
    if (stage) { conditions.push(`c.stage = $${params.length + 1}`); params.push(stage); }
    if (search) { conditions.push(`(c.name ILIKE $${params.length + 1} OR c.company ILIKE $${params.length + 1})`); params.push(`%${search}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY c.id ORDER BY c.updated_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create client
router.post('/', async (req, res) => {
  const { name, company, email, phone, stage, project_type, budget, notes, tags } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO clients (name, company, email, phone, stage, project_type, budget, notes, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, company, email, phone, stage || 'lead', project_type, budget, notes, tags]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update client
router.patch('/:id', async (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const set = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  try {
    const { rows } = await db.query(
      `UPDATE clients SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
