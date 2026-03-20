const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const db = require('../config/db');

router.use(requireAdmin);

router.get('/', async (req, res) => {
  const { client_id, status, assignee } = req.query;
  try {
    let q = 'SELECT t.*, c.name as client_name FROM tasks t LEFT JOIN clients c ON t.client_id = c.id WHERE 1=1';
    const p = [];
    if (client_id) { p.push(client_id); q += ` AND t.client_id = $${p.length}`; }
    if (status)    { p.push(status);    q += ` AND t.status = $${p.length}`; }
    if (assignee)  { p.push(assignee);  q += ` AND t.assignee = $${p.length}`; }
    q += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';
    const { rows } = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { client_id, title, description, assignee, priority, due_date } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO tasks (client_id, title, description, assignee, priority, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [client_id, title, description, assignee, priority || 'medium', due_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', async (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const set = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  try {
    const { rows } = await db.query(`UPDATE tasks SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id, ...values]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
