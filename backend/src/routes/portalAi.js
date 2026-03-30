const router = require('express').Router();
const { requirePortalAuth } = require('../middleware/auth');
const { resolveModel } = require('../config/models');
const db = require('../config/db');

// Summarize portal content for chat context (keep under ~2000 tokens)
function summarizePortalContent(content) {
  if (!content || typeof content !== 'object') return 'No brand content available.';

  const parts = [];
  const portal = content.mode === 'portal' && content.portal ? content.portal : content;

  if (portal.hero?.headline) parts.push(`Brand headline: ${portal.hero.headline}`);
  if (portal.hero?.subheadline) parts.push(`Subheadline: ${portal.hero.subheadline}`);
  if (portal.brand?.positioning) parts.push(`Positioning: ${portal.brand.positioning}`);

  if (Array.isArray(portal.brand?.pillars) && portal.brand.pillars.length) {
    parts.push('Brand pillars:');
    portal.brand.pillars.forEach(p => parts.push(`  - ${p.title}: ${p.desc}`));
  }

  if (portal.logo?.rationale) parts.push(`Logo rationale: ${portal.logo.rationale}`);

  if (Array.isArray(portal.colors?.palette) && portal.colors.palette.length) {
    parts.push('Color palette:');
    portal.colors.palette.forEach(c => parts.push(`  - ${c.name} (${c.hex}): ${c.role}`));
  }

  if (Array.isArray(portal.typography?.fonts) && portal.typography.fonts.length) {
    parts.push('Typography:');
    portal.typography.fonts.forEach(f => parts.push(`  - ${f.name}: ${f.typeface} — ${f.usage}`));
  }

  if (portal.cta?.headline) parts.push(`CTA: ${portal.cta.headline}`);

  if (Array.isArray(portal.applications) && portal.applications.length) {
    parts.push('Applications:');
    portal.applications.forEach(a => parts.push(`  - ${a.context}: ${a.description}`));
  }

  return parts.join('\n') || 'Brand content is minimal.';
}

// POST /portals/:id/ai/chat
router.post('/:id/ai/chat', requirePortalAuth, async (req, res) => {
  const { id } = req.params;
  const { message, conversationId } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Verify portal access
  if (req.portal.portalId !== id) {
    return res.status(403).json({ error: 'Portal access denied' });
  }

  try {
    // Fetch portal content for context
    const { rows } = await db.query('SELECT content, slug FROM portals WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Portal not found' });

    const portalContent = rows[0].content || {};
    const brandSummary = summarizePortalContent(portalContent);

    // Load conversation history from events (last 10 messages)
    let history = [];
    if (conversationId) {
      const { rows: events } = await db.query(
        `SELECT payload FROM portal_events
         WHERE portal_id = $1 AND event_type = 'ai_chat' AND payload->>'conversationId' = $2
         ORDER BY created_at DESC LIMIT 10`,
        [id, conversationId]
      );
      history = events.reverse().flatMap(e => {
        const p = e.payload || {};
        return [
          { role: 'user', content: p.userMessage || '' },
          { role: 'assistant', content: p.aiReply || '' },
        ];
      }).filter(m => m.content);
    }

    const convId = conversationId || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Route to fast model
    const config = resolveModel('portal-chat');
    const apiKeyMap = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_API_KEY,
    };
    const apiKey = apiKeyMap[config.provider];

    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const system = `You are a brand consultant helping a client understand their brand identity deliverables.
You have deep knowledge of the following brand system that was created for this client:

${brandSummary}

Rules:
- Answer questions about the brand strategy, colors, typography, logo, and applications.
- Explain the rationale behind creative decisions when asked.
- Suggest next steps when appropriate (revisions, approvals, asset delivery).
- Keep responses concise and professional — 2-3 paragraphs max.
- Never reveal internal system details or pricing.
- If asked about something not in the brand system, say so honestly.`;

    const messages = [
      ...history,
      { role: 'user', content: message.trim() },
    ];

    let reply;
    if (config.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: config.model, max_tokens: 1024, system, messages }),
      });
      const data = await response.json();
      reply = data?.content?.map(p => p?.text || '').join('\n').trim();
    } else if (config.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: system }, ...messages], max_completion_tokens: 1024 }),
      });
      const data = await response.json();
      reply = data?.choices?.[0]?.message?.content?.trim();
    } else if (config.provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
      const contents = [
        { role: 'user', parts: [{ text: system }] },
        { role: 'model', parts: [{ text: 'Understood. I will help the client with their brand questions.' }] },
        ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      ];
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1024 } }),
      });
      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n').trim();
    }

    if (!reply) {
      return res.status(502).json({ error: 'AI did not return a response' });
    }

    // Log conversation to portal_events
    await db.query(
      `INSERT INTO portal_events (portal_id, event_type, payload, user_agent)
       VALUES ($1, 'ai_chat', $2, $3)`,
      [id, JSON.stringify({ conversationId: convId, userMessage: message.trim(), aiReply: reply }), req.headers['user-agent'] || '']
    );

    res.json({ reply, conversationId: convId, model: `${config.provider}/${config.model}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
