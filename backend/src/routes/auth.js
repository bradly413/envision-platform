const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function verifyPortalPassword(portal, password) {
  let hashMatched = false;

  if (portal?.password_hash) {
    try {
      hashMatched = await bcrypt.compare(password, portal.password_hash);
    } catch {
      hashMatched = false;
    }
  }

  if (hashMatched) return true;

  if (portal?.plain_password && password === portal.plain_password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE portals SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, portal.id]
    );
    portal.password_hash = passwordHash;
    return true;
  }

  return false;
}

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    // jsonwebtoken@9 throws if expiresIn is explicitly undefined — fall back so
    // a missing Railway JWT_EXPIRES_IN cannot hard-fail admin login with HTTP 500.
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client portal login (slug + password)
router.post('/portal-login', async (req, res) => {
  const { slug, password } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT p.*, c.name as client_name, c.company FROM portals p JOIN clients c ON p.client_id = c.id WHERE p.slug = $1 AND p.status = $2',
      [slug, 'active']
    );
    const portal = rows[0];
    if (!portal || !await verifyPortalPassword(portal, password))
      return res.status(401).json({ error: 'Invalid credentials' });
    if (portal.expires_at && new Date(portal.expires_at) < new Date())
      return res.status(403).json({ error: 'This presentation has expired' });
    const token = jwt.sign({ portalId: portal.id, slug: portal.slug, clientId: portal.client_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    // Log login event
    await db.query('INSERT INTO portal_events (portal_id, event_type, payload) VALUES ($1, $2, $3)', [portal.id, 'login', JSON.stringify({ timestamp: new Date() })]);
    res.json({ token, portal: { id: portal.id, slug: portal.slug, templateId: portal.template_id, clientName: portal.client_name, company: portal.company, content: portal.content } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
