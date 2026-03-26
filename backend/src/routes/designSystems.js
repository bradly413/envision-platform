const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const db = require('../config/db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS design_systems (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      thumbnail_color TEXT DEFAULT '#d4af37',
      source_portal_id UUID REFERENCES portals(id) ON DELETE SET NULL,
      experience JSONB NOT NULL DEFAULT '{}',
      colors JSONB NOT NULL DEFAULT '[]',
      typography JSONB NOT NULL DEFAULT '{}',
      copy_style JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureTable().catch(console.error);

// List
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM design_systems ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create manually
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, thumbnail_color, source_portal_id, experience, colors, typography, copy_style } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO design_systems (name, description, thumbnail_color, source_portal_id, experience, colors, typography, copy_style)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description || '', thumbnail_color || '#d4af37', source_portal_id || null,
       JSON.stringify(experience || {}), JSON.stringify(colors || []),
       JSON.stringify(typography || {}), JSON.stringify(copy_style || {})]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Save from portal — extracts full design DNA
router.post('/from-portal/:portalId', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows: pRows } = await db.query(
      'SELECT p.*, c.name as client_name FROM portals p JOIN clients c ON p.client_id = c.id WHERE p.id = $1',
      [req.params.portalId]
    );
    if (!pRows[0]) return res.status(404).json({ error: 'Portal not found' });
    const portal = pRows[0];
    const content = portal.content || {};
    const experience = content.experience || {};
    const colors = content.colors && content.colors.palette ? content.colors.palette : (Array.isArray(content.colors) ? content.colors : []);
    const typography = { fonts: (content.typography && content.typography.fonts) || [], usage: (content.typography && content.typography.usage) || '', primaryFont: (content.typography && content.typography.primaryFont) || '' };
    const primaryColor = (colors[0] && colors[0].hex) ? colors[0].hex : '#d4af37';
    const copy_style = {
      heroHeadlineLength: ((content.hero && content.hero.headline) || '').split(' ').length,
      taglineStyle: (content.hero && content.hero.subheadline) || '',
      pillarCount: (content.brand && content.brand.pillars && content.brand.pillars.length) || 3,
      preset: experience.preset || 'cinematic-editorial',
      motionLevel: experience.motionLevel || 'immersive',
      sampleHeadlines: [
        content.hero && content.hero.headline,
        content.brand && content.brand.headline,
        content.colors && content.colors.headline,
        content.typography && content.typography.headline,
      ].filter(Boolean),
    };
    const { rows } = await db.query(
      `INSERT INTO design_systems (name, description, thumbnail_color, source_portal_id, experience, colors, typography, copy_style)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name || (portal.client_name + ' Design System'),
       description || ('Extracted from ' + portal.client_name + ' portal'),
       primaryColor, portal.id,
       JSON.stringify(experience), JSON.stringify(colors),
       JSON.stringify(typography), JSON.stringify(copy_style)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM design_systems WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
