const MODEL_REGISTRY = {
  'claude-sonnet-4': { id: 'claude-sonnet-4', provider: 'anthropic', model: 'claude-sonnet-4-20250514', capabilities: ['generation', 'code', 'chat'], speed: 'medium', cost: 'medium' },
  'claude-opus-4': { id: 'claude-opus-4', provider: 'anthropic', model: 'claude-opus-4-20250514', capabilities: ['generation', 'code', 'chat', 'complex-reasoning'], speed: 'slow', cost: 'high' },
  'gpt-4.1': { id: 'gpt-4.1', provider: 'openai', model: 'gpt-4.1', capabilities: ['generation', 'code', 'chat'], speed: 'medium', cost: 'medium' },
  'gpt-4.1-mini': { id: 'gpt-4.1-mini', provider: 'openai', model: 'gpt-4.1-mini', capabilities: ['chat', 'summarize', 'classify'], speed: 'fast', cost: 'low' },
  'gemini-2.0-flash': { id: 'gemini-2.0-flash', provider: 'google', model: 'gemini-2.0-flash', capabilities: ['chat', 'summarize', 'qa', 'classify'], speed: 'fast', cost: 'low' },
  'gemini-2.5-pro': { id: 'gemini-2.5-pro', provider: 'google', model: 'gemini-2.5-pro-preview-06-05', capabilities: ['generation', 'code', 'chat', 'complex-reasoning'], speed: 'slow', cost: 'high' },
};

const TASK_ROUTING = {
  'portal-generation': ['claude-sonnet-4', 'gpt-4.1'],
  'presentation': ['claude-sonnet-4', 'gpt-4.1'],
  'cinematic-flow': ['claude-sonnet-4', 'gpt-4.1'],
  'cinematic-code': ['claude-opus-4', 'claude-sonnet-4'],
  'portal-chat': ['gemini-2.0-flash', 'gpt-4.1-mini', 'claude-sonnet-4'],
  'document-qa': ['gemini-2.0-flash', 'gpt-4.1-mini'],
  'summarize': ['gemini-2.0-flash', 'gpt-4.1-mini'],
};

const PROVIDER_API_KEYS = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
};

function hasProviderKey(provider) {
  const envVar = PROVIDER_API_KEYS[provider];
  return envVar ? Boolean(process.env[envVar]) : false;
}

function resolveModel(task, preferredModel) {
  // If caller explicitly requested a model, use it
  if (preferredModel) {
    const entry = MODEL_REGISTRY[preferredModel];
    if (entry) return { provider: entry.provider, model: entry.model };
    // Try matching by raw model string (e.g., 'claude-sonnet-4-20250514')
    const byModel = Object.values(MODEL_REGISTRY).find(e => e.model === preferredModel);
    if (byModel) return { provider: byModel.provider, model: byModel.model };
  }

  // Route by task type — pick first model with available API key
  const candidates = TASK_ROUTING[task] || TASK_ROUTING['portal-generation'];
  for (const id of candidates) {
    const entry = MODEL_REGISTRY[id];
    if (entry && hasProviderKey(entry.provider)) {
      return { provider: entry.provider, model: entry.model };
    }
  }

  // Fallback: return first candidate regardless of key availability
  const fallback = MODEL_REGISTRY[candidates[0]];
  return { provider: fallback.provider, model: fallback.model };
}

function getTaskForOutputMode(outputMode) {
  if (outputMode === 'presentation') return 'presentation';
  if (outputMode === 'cinematic-flow') return 'cinematic-flow';
  if (outputMode === 'cinematic-code') return 'cinematic-code';
  return 'portal-generation';
}

module.exports = {
  MODEL_REGISTRY,
  TASK_ROUTING,
  resolveModel,
  getTaskForOutputMode,
  hasProviderKey,
};
