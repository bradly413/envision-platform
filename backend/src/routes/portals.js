const router = require('express').Router();
const { requireAdmin, requirePortalAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('../config/db');

// Admin: list portals
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT p.*, c.name as client_name, c.company, COUNT(pe.id) as total_events FROM portals p JOIN clients c ON p.client_id = c.id LEFT JOIN portal_events pe ON pe.portal_id = p.id GROUP BY p.id, c.name, c.company ORDER BY p.created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: create portal for a client
router.post('/')// Portal: public login — exchange slug + password for a JWT token
router.post('/login', async (req, res) => {
  const { code, password } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT * FROM portals WHERE slug = $1',
      [code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = rows[0];

    if (portal.status !== 'active') return res.status(403).json({ error: 'Portal not active' });

    const valid = await bcrypt.compare(password, portal.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = require('jsonwebtoken').sign(
      { portalId: portal.id, slug: portal.slug },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, portalId: portal.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
}); requireAdmin, async (req, res) => {
  const { client_id, password, template_id, content, expires_at } = req.body;
  try {
    const slug = uuid().split('-')[0]; // short unique slug
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO portals (client_id, slug, password_hash, plain_password, template_id, content, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [client_id, slug, password_hash, password, template_id || 'brand-reveal-v1', JSON.stringify(content || {}), expires_at]
    );
    res.status(201).json({ ...rows[0], url: `${process.env.PORTAL_URL}/${slug}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: update portal (content, status, etc.)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { content, status, expires_at } = req.body;
  try {
    // Build dynamic SET clause so we don't wipe fields that weren't passed
    const updates = [];
    const values = [];
    let i = 1;
    if (content !== undefined) { updates.push(`content = $${i++}`); values.push(JSON.stringify(content)); }
    if (status !== undefined)  { updates.push(`status = $${i++}`);  values.push(status); }
    if (expires_at !== undefined) { updates.push(`expires_at = $${i++}`); values.push(expires_at); }
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE portals SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: get portal analytics
router.get('/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const { rows: events } = await db.query(
      'SELECT * FROM portal_events WHERE portal_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    // Compute summary
    const logins = events.filter(e => e.event_type === 'login');
    const scrollEvents = events.filter(e => e.event_type === 'scroll');
    const maxScroll = scrollEvents.length ? Math.max(...scrollEvents.map(e => e.payload?.percent || 0)) : 0;
    const sections = events.filter(e => e.event_type === 'section_view').map(e => e.payload?.section);
    const firstLogin = logins[0]?.created_at;
    const lastEvent = events[events.length - 1]?.created_at;
    const sessionMs = firstLogin && lastEvent ? new Date(lastEvent) - new Date(firstLogin) : 0;
    res.json({
      totalVisits: logins.length,
      totalEvents: events.length,
      maxScrollDepth: maxScroll,
      avgSessionMinutes: Math.round(sessionMs / 60000),
      sectionsViewed: [...new Set(sections)],
      approved: events.some(e => e.event_type === 'approve'),
      timeline: events,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Portal: track event (called from client portal frontend)
router.post('/:id/events', requirePortalAuth, async (req, res) => {
  const { event_type, payload } = req.body;
  try {
    await db.query(
      'INSERT INTO portal_events (portal_id, event_type, payload, user_agent) VALUES ($1,$2,$3,$4)',
      [req.params.id, event_type, JSON.stringify(payload || {}), req.headers['user-agent']]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: delete portal
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM portals WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Portal: list comments
router.get('/:id/comments', requirePortalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, section, text, created_at FROM portal_comments WHERE portal_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Portal: add comment
router.post('/:id/comments', requirePortalAuth, async (req, res) => {
  const { section, text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO portal_comments (portal_id, section, text) VALUES ($1,$2,$3) RETURNING id, section, text, created_at',
      [req.params.id, section || 'general', text.trim()]
    );
    // Also track as a portal event so it shows in admin analytics
    await db.query(
      'INSERT INTO portal_events (portal_id, event_type, payload, user_agent) VALUES ($1,$2,$3,$4)',
      [req.params.id, 'comment', JSON.stringify({ section, preview: text.trim().slice(0, 80) }), req.headers['user-agent']]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: get single portal (used by editor)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT p.*, c.name as client_name, c.company FROM portals p JOIN clients c ON p.client_id = c.id WHERE p.id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Portal not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
