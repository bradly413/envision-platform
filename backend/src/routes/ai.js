const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { generateBuilderContent } = require('../services/ai');

router.use(requireAdmin);

async function handleBuilder(req, res) {
  const {
    provider = 'anthropic',
    model,
    styleMode = 'cinematic',
    templateId = 'brand-reveal-v1',
    outputMode = 'portal',
    messages = [],
    maxTokens = 1400,
  } = req.body || {};

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages is required' });
  }

  try {
    const result = await generateBuilderContent({
      provider,
      model,
      styleMode,
      templateId,
      outputMode,
      messages,
      maxTokens,
    });

    res.json({
      outputMode: result.outputMode,
      provider: result.provider,
      model: result.model,
      reply: result.text,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.post('/builder', handleBuilder);
router.post('/portal-editor', handleBuilder);

module.exports = router;
