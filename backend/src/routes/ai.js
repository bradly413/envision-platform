const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { generateBuilderContent } = require('../services/ai');

router.use(requireAdmin);

// Mode-aware token budgets — portal needs room for all 7 JSON sections,
// cinematic-flow needs room for 6–10 scenes, presentations for 8–12 slides.
const MODE_TOKEN_DEFAULTS = {
  portal: 8192,
  presentation: 12288,
  'cinematic-flow': 16384,
  'cinematic-code': 24576,
};

async function handleBuilder(req, res) {
  const {
    provider = 'anthropic',
    model,
    styleMode = 'cinematic',
    templateId = 'brand-reveal-v1',
    portalIntent = 'brand-identity',
    outputMode = 'portal',
    messages = [],
    maxTokens,
  } = req.body || {};

  // Use caller's maxTokens if provided, otherwise pick the mode default
  const resolvedTokens = maxTokens || MODE_TOKEN_DEFAULTS[outputMode] || 8192;

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages is required' });
  }

  try {
    const result = await generateBuilderContent({
      provider,
      model,
      styleMode,
      templateId,
      portalIntent,
      outputMode,
      messages,
      maxTokens: resolvedTokens,
    });

    res.json({
      outputMode: result.outputMode,
      provider: result.provider,
      model: result.model,
      reply: result.text,
      structured: result.structured || null,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.post('/builder', handleBuilder);
router.post('/portal-editor', handleBuilder);

module.exports = router;
