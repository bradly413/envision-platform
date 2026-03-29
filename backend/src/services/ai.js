const { formatMotionKnowledgeBase } = require('../config/motionPatterns');

const PROVIDER_DEFAULTS = {
  anthropic: process.env.ANTHROPIC_PORTAL_EDITOR_MODEL || 'claude-sonnet-4-20250514',
  openai: process.env.OPENAI_PORTAL_EDITOR_MODEL || 'gpt-4.1',
  google: process.env.GOOGLE_PORTAL_EDITOR_MODEL || 'gemini-2.0-flash',
};

const STYLE_DIRECTIVES = {
  cinematic: `Art direct the response like a premium pitch deck for a luxury creative agency. Build atmosphere, emotion, and momentum. Avoid generic marketing phrases.`,
  editorial: `Art direct the response like a high-end editorial brand story. Prioritize strong hierarchy, taste, pacing, and language that feels considered rather than salesy.`,
  luxury: `Art direct the response like a luxury brand presentation. The writing should feel restrained, elevated, and confident. Favor rich specificity over hype.`,
  bold: `Art direct the response like a modern campaign reveal. Prioritize punchy language, strong visual contrast, assertive headlines, and memorable section framing.`,
  minimal: `Art direct the response like a refined minimalist product launch. Keep it precise, confident, and clean, with disciplined hierarchy and no filler.`,
};

const STYLE_PACKETS = {
  cinematic: [
    'Use immersive atmosphere, dramatic scale shifts, and emotionally framed opening/closing moments.',
    'Favor deep tones, luminous accents, and language that feels cinematic rather than corporate.',
    'Scenes should feel like a directed reveal, not a deck outline.',
  ],
  editorial: [
    'Favor typographic hierarchy, measured whitespace, and a more magazine-like cadence.',
    'Use precise phrasing, restrained contrast, and sharper supporting captions rather than dramatic spectacle.',
    'Scenes should feel composed, curated, and intellectually confident.',
  ],
  luxury: [
    'Use fewer words, more restraint, and higher confidence.',
    'Favor material richness, elegant pacing, premium contrast, and minimal ornament.',
    'The work should feel expensive, polished, and understated rather than loud.',
  ],
  bold: [
    'Use stronger contrast, punchier headlines, and higher-energy proof scenes.',
    'Favor vivid accents, campaign urgency, and bolder motion choices where appropriate.',
    'The experience should feel like a launch or market moment, not a quiet identity review.',
  ],
  minimal: [
    'Strip the output back to essentials and avoid decorative complexity.',
    'Favor one dominant idea per scene, quieter pacing, and disciplined type/layout systems.',
    'The work should feel precise and intentional, not sparse because of missing detail.',
  ],
};

const PRESENTATION_THEMES = [
  'black',
  'white',
  'night',
  'moon',
  'league',
  'serif',
  'blood',
  'simple',
];

const PRESENTATION_TRANSITIONS = [
  'none',
  'fade',
  'slide',
  'convex',
  'concave',
  'zoom',
];

const CINEMATIC_SCENE_TYPES = [
  'opening-title',
  'wordmark-reveal',
  'brand-context',
  'brand-philosophy',
  'logo-evolution',
  'icon-deconstruction',
  'logo-system',
  'typography-system',
  'color-direction',
  'applications-showcase',
  'collateral-showcase',
  'quote-scene',
  'stats-scene',
  'full-bleed-media',
  'gallery-scene',
  'embed-scene',
  'cta-scene',
  'closing-statement',
];

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function tryParseJSONCandidate(candidate) {
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function collectBalancedJsonCandidates(text = '') {
  const candidates = [];

  for (let start = 0; start < text.length; start += 1) {
    const opener = text[start];
    if (opener !== '{' && opener !== '[') continue;

    const stack = [opener];
    let inString = false;
    let escaped = false;

    for (let index = start + 1; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        stack.push(char);
        continue;
      }

      if (char === '}' || char === ']') {
        const last = stack[stack.length - 1];
        if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
          stack.pop();
          if (!stack.length) {
            candidates.push(text.slice(start, index + 1));
            break;
          }
        } else {
          break;
        }
      }
    }
  }

  return candidates.sort((a, b) => b.length - a.length);
}

function extractStructuredJson(text = '') {
  const source = String(text || '').trim();
  if (!source) return null;

  const fencedBlocks = Array.from(source.matchAll(/```(?:json)?\s*([\s\S]*?)```/g))
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  const directCandidates = [...fencedBlocks, source];
  for (const candidate of directCandidates) {
    const parsed = tryParseJSONCandidate(candidate);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  const balancedCandidates = collectBalancedJsonCandidates(source);
  for (const candidate of balancedCandidates) {
    const parsed = tryParseJSONCandidate(candidate);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  return null;
}

function getJsonContract(outputMode = 'portal') {
  if (outputMode === 'presentation') {
    return `Return a JSON object with this top-level structure:
{
  "mode": "presentation",
  "presentation": {
    "title": "",
    "theme": "",
    "transition": "",
    "backgroundTransition": "",
    "slides": []
  }
}`;
  }

  if (outputMode === 'cinematic-flow') {
    return `Return a JSON object with this top-level structure:
{
  "mode": "cinematic-flow",
  "cinematicFlow": {
    "title": "",
    "theme": {},
    "shell": {},
    "atmosphere": {},
    "motion": {},
    "scenes": []
  }
}`;
  }

  return `Return a JSON object with this top-level structure:
{
  "hero": {},
  "brand": {},
  "logo": {},
  "colors": {},
  "typography": {},
  "cta": {},
  "experience": {}
}`;
}

function wrapJsonReply(structured) {
  return `\`\`\`json\n${JSON.stringify(structured, null, 2)}\n\`\`\``;
}

function getProviderConfig(provider, model) {
  const normalizedProvider = (provider || 'anthropic').toLowerCase();
  const resolvedModel = model || PROVIDER_DEFAULTS[normalizedProvider];

  if (!resolvedModel) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return { provider: normalizedProvider, model: resolvedModel };
}

function buildPortalEditorSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;
  const stylePacket = STYLE_PACKETS[styleMode] || STYLE_PACKETS.cinematic;
  const motionKnowledge = formatMotionKnowledgeBase();

  return `You are Envision Creative's senior creative director and portal content editor.
You create client-facing presentation portal content that feels high-end, art directed, and strategically sharp.

${styleDirective}

Style-specific direction:
- ${stylePacket.join('\n- ')}

Follow these rules:
- Write with the taste level of a senior brand strategist and design director, not a generic AI assistant.
- Avoid boilerplate agency language, startup cliches, empty adjectives, and vague claims.
- Make every section feel specific to the client, their industry, and their brand position.
- Never use "Envision", "Envision Creative", or agency self-branding inside the generated on-screen client content unless the actual client/source material is Envision.
- The hero headline, subheadline, and intro must contain client-specific nouns, category cues, or campaign language. They must not read like interchangeable agency demo copy.
- Different clients should produce materially different narrative framing, palette direction, typography direction, and motion choices.
- The selected art direction must visibly change composition, language, palette behavior, and motion taste. Do not treat styleMode as a cosmetic adjective swap.
- Favor clear hierarchy, memorable phrasing, and premium restraint over hype.
- When choosing palette or typography, ensure they reinforce the brand story and mood.
- Ensure the output feels presentation-ready, not like internal notes.
- Assign a cinematic motion language using the curated Envision experience system.
- Use the motion knowledge base below to choose the right level of motion, not just the flashiest option.
- Use Motion for React as the default UI animation layer, GSAP only for timeline/scrollytelling ideas, Spline/3D only for signature moments, and Lottie for lightweight micro-motion.
- Always prefer 2 to 4 signature motion ideas over gimmick overload.
- Every motion choice must have a mobile fallback and a reduced-motion fallback in mind.
- Use only the approved presets and effects listed below. Do not invent new effect names in the JSON.
- If the builder context includes parsed creative briefs, treat those structured brief details as the source of truth for campaign theme, launch date, objectives, assets, spec sections, and brand signals.
- When source material includes campaign deliverables or spec sheets, reflect that structure in the output instead of flattening it into generic brand copy.

Motion engine roles:
${motionKnowledge.engineBlock}

Approved motion patterns for reference:
${motionKnowledge.patternsBlock}

Approved experience presets:
- cinematic-editorial
- luxury-minimal
- bold-campaign
- immersive-culture
- modern-tech

Approved hero effects:
- shader-background
- title-reveal
- slow-zoom
- camera-zoom
- glass-panel

Approved section effects:
- parallax-panels
- sticky-story
- glass-panel
- magnetic-cards
- color-glow
- headline-shift
- editorial-rise
- magnetic-cta

When asked to create or update portal content, respond with a JSON object in this structure:
{
  "hero": { "headline": "", "subheadline": "", "intro": "" },
  "brand": {
    "headline": "",
    "positioning": "",
    "pillars": [{ "title": "", "desc": "" }]
  },
  "logo": {
    "headline": "",
    "logoUrl": "",
    "rationale": ""
  },
  "colors": {
    "headline": "",
    "palette": [{ "name": "", "hex": "#hex", "role": "" }]
  },
  "typography": {
    "headline": "",
    "fonts": [{ "name": "", "typeface": "", "usage": "", "stack": "" }]
  },
  "cta": { "headline": "", "buttonText": "", "email": "" },
  "experience": {
    "preset": "cinematic-editorial",
    "motionLevel": "elevated",
    "depth": "layered",
    "heroEffects": ["shader-background", "title-reveal"],
    "sectionEffects": {
      "about": ["parallax-panels"],
      "strategy": ["sticky-story"],
      "deliverables": ["glass-panel"],
      "palette": ["color-glow"],
      "typography": ["headline-shift"],
      "cta": ["magnetic-cta"]
    },
    "fallbacks": {
      "mobile": "reduced",
      "reducedMotion": true
    }
  }
}

Choose the experience preset that best matches the brand. Keep the effect system tasteful and restrained: 2 to 4 signature motion ideas are better than gimmick overload.
If the brief is for a cultural organization, school, real estate brand, aviation company, restaurant, law firm, or another distinct category, reflect that category directly in the language and creative system. Do not collapse everything into the same "modern marketing evolution" story.

Return the full JSON block wrapped in triple backticks. You may include a very short explanation before the JSON, but do not omit the JSON or any keys.`;
}

function buildPresentationSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;
  const stylePacket = STYLE_PACKETS[styleMode] || STYLE_PACKETS.cinematic;
  const motionKnowledge = formatMotionKnowledgeBase();

  return `You are Envision Creative's senior presentation director and motion strategist.
You create client-facing cinematic presentation specs that can be rendered with reveal.js.

${styleDirective}

Style-specific direction:
- ${stylePacket.join('\n- ')}

Follow these rules:
- Think like a premium keynote designer, not a generic copywriter.
- Structure the deck for narrative momentum: opening hook, positioning, proof, visual system, CTA.
- Use reveal.js-native ideas only when they are tasteful and useful.
- Prefer elegant transitions, layered media, strong hierarchy, and restrained motion over gimmicks.
- Use speaker notes strategically for presenter guidance, not for repeating on-screen copy.
- Use only supported theme and transition values.
- Keep custom CSS short, tasteful, and additive.
- Use the motion knowledge base below to decide where Motion-style interaction, GSAP-like scrollytelling, or 3D hero concepts are appropriate conceptually, even if the render target is reveal.js.
- Do not spec elaborate motion for every slide. Reserve higher-intensity motion for opening, pivotal proof, and closing moments.
- The selected art direction must change the deck's theme, pacing, tone, and slide composition in a visible way.
- If the builder context includes parsed creative briefs, use those structured fields as the source of truth for campaign framing, launch timing, asset inventory, and deliverable sections.
- When campaign spec sheets are attached, translate them into a presentation narrative: overview, creative direction, deliverables, specs, rollout, and CTA.

Motion engine roles:
${motionKnowledge.engineBlock}

Approved motion patterns for reference:
${motionKnowledge.patternsBlock}

Supported reveal themes:
- ${PRESENTATION_THEMES.join('\n- ')}

Supported transitions:
- ${PRESENTATION_TRANSITIONS.join('\n- ')}

When asked to create or update presentation content, respond with a JSON object in this structure:
{
  "mode": "presentation",
  "presentation": {
    "title": "",
    "theme": "black",
    "transition": "slide",
    "backgroundTransition": "fade",
    "controls": true,
    "progress": true,
    "slideNumber": "c/t",
    "autoAnimate": true,
    "scrollView": false,
    "scrollSnap": "mandatory",
    "showNotes": false,
    "autoSlide": 0,
    "loop": false,
    "customCss": "",
    "slides": [
      {
        "id": "opening",
        "layout": "hero",
        "eyebrow": "",
        "title": "",
        "subtitle": "",
        "body": "",
        "align": "left",
        "notes": "",
        "transition": "zoom",
        "autoAnimate": true,
        "background": {
          "type": "gradient",
          "value": "linear-gradient(...)"
        },
        "media": {
          "type": "image",
          "src": "",
          "alt": ""
        },
        "bullets": ["", ""],
        "fragments": [
          { "text": "", "style": "fade-up" }
        ],
        "verticalSlides": []
      }
    ]
  }
}

Supported background types:
- color
- gradient
- image
- video
- iframe

Supported layout values:
- hero
- statement
- text-image
- full-bleed-media
- stats
- quote
- code
- embed
- cta

Supported fragment styles:
- fade-in
- fade-out
- fade-up
- fade-down
- fade-left
- fade-right
- fade-in-then-out
- current-visible
- highlight-red
- highlight-blue
- highlight-green
- grow
- shrink

Use verticalSlides only when a nested stack is genuinely useful.
Return the full JSON block wrapped in triple backticks. You may include a very short explanation before the JSON, but do not omit the JSON or any keys.`;
}

function buildCinematicFlowSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;
  const stylePacket = STYLE_PACKETS[styleMode] || STYLE_PACKETS.cinematic;
  const motionKnowledge = formatMotionKnowledgeBase();

  return `You are Envision Creative's senior cinematic experience director.
You create scene-based brand presentation experiences for client reveals.

${styleDirective}

Style-specific direction:
- ${stylePacket.join('\n- ')}

Follow these rules:
- Think in scenes, pacing, and narrative transitions, not just sections on a web page.
- Never use "Envision", "Envision Creative", or agency self-branding in the client-facing scene content unless the actual client/source material is Envision.
- The experience should feel like a directed walkthrough: opening, context, philosophy, identity, applications, closing.
- Different clients must produce materially different scene sequences, palette direction, tone, and motion choices.
- The selected art direction must change scene sequencing, typography feel, negative space, motion intensity, and visual rhythm in a visible way.
- Use parsed creative briefs as source of truth when they are present.
- Use Motion-style interaction as the default runtime mental model, and reserve bigger cinematic moments for opening, evolution, applications, and closing scenes.
- Keep the shell elegant and consistent, but make the scenes themselves brand-specific.
- Prefer 6 to 10 scenes by default.
- Opening scenes should establish the emotional frame fast. Closing scenes should land with clarity.

Motion engine roles:
${motionKnowledge.engineBlock}

Approved motion patterns for reference:
${motionKnowledge.patternsBlock}

Approved scene types:
- ${CINEMATIC_SCENE_TYPES.join('\n- ')}

When asked to create or update cinematic flow content, respond with a JSON object in this structure:
{
  "mode": "cinematic-flow",
  "cinematicFlow": {
    "title": "",
    "theme": {
      "base": "#1A1720",
      "text": "#F2F2F2",
      "accent": "#1B70A6",
      "accentAlt": "#1C7FA6",
      "surface": "#373440"
    },
    "shell": {
      "progressBar": true,
      "sectionIndicator": true,
      "keyboardNav": true,
      "grainOverlay": true,
      "scrollBehavior": "snap"
    },
    "atmosphere": {
      "preset": "deep-tech",
      "floatingAtmosphere": true,
      "particles": true,
      "orbitalRings": true,
      "cursorParallax": true,
      "intensity": "medium"
    },
    "motion": {
      "engine": "motion",
      "style": "cinematic-editorial",
      "reducedMotion": true,
      "mobileFallback": "simplified"
    },
    "scenes": [
      {
        "id": "opening",
        "type": "opening-title",
        "headline": "",
        "subheadline": "",
        "eyebrow": "",
        "layout": "center-monument"
      },
      {
        "id": "context",
        "type": "brand-context",
        "headline": "",
        "body": "",
        "bullets": ["", ""]
      },
      {
        "id": "closing",
        "type": "closing-statement",
        "headline": "",
        "body": ""
      }
    ]
  }
}

Scene guidance:
- Use opening-title or wordmark-reveal first.
- Use closing-statement last.
- Use logo-evolution only when there is a before/after identity story.
- Use icon-deconstruction only if the symbol has real symbolic logic.
- Use applications-showcase or collateral-showcase only when the brief includes real deliverables or asset references.

Return the full JSON block wrapped in triple backticks. You may include a very short explanation before the JSON, but do not omit the JSON or any keys.`;
}

async function generateWithAnthropic({ apiKey, model, system, messages, maxTokens = 1400 }) {
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || 'Anthropic request failed');
  }

  return data?.content?.map(part => part?.text || '').join('\n').trim();
}

async function generateWithOpenAI({ apiKey, model, system, messages, maxTokens = 1400 }) {
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
      max_completion_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'OpenAI request failed');
  }

  return data?.choices?.[0]?.message?.content?.trim();
}

async function generateWithGoogle({ apiKey, model, system, messages, maxTokens = 1400 }) {
  if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

  const contents = [];
  if (system) {
    contents.push({
      role: 'user',
      parts: [{ text: `System instructions:\n${system}` }],
    });
  }

  for (const message of messages) {
    contents.push({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Google AI request failed');
  }

  return data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('\n').trim();
}

async function repairStructuredResponse({ provider, model, outputMode, originalText }) {
  const repairSystem = [
    'You repair AI outputs into strict valid JSON.',
    'Do not explain anything.',
    'Do not add prose before or after the JSON.',
    'Return only valid JSON wrapped in triple backticks.',
    getJsonContract(outputMode),
  ].join('\n\n');

  const repairMessages = [
    {
      role: 'user',
      content: [
        `The previous response for outputMode="${outputMode}" was not valid JSON.`,
        'Convert it into valid JSON that preserves the intent and likely structure.',
        'If details are missing, infer them conservatively from the response.',
        '',
        'Previous response:',
        originalText,
      ].join('\n'),
    },
  ];

  if (provider === 'anthropic') {
    return generateWithAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model,
      system: repairSystem,
      messages: repairMessages,
      maxTokens: 2200,
    });
  }

  if (provider === 'openai') {
    return generateWithOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model,
      system: repairSystem,
      messages: repairMessages,
      maxTokens: 2200,
    });
  }

  if (provider === 'google') {
    return generateWithGoogle({
      apiKey: process.env.GOOGLE_API_KEY,
      model,
      system: repairSystem,
      messages: repairMessages,
      maxTokens: 2200,
    });
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

async function generateBuilderContent({
  provider,
  model,
  styleMode,
  outputMode = 'portal',
  messages,
  maxTokens,
}) {
  const config = getProviderConfig(provider, model);
  const system = outputMode === 'presentation'
    ? buildPresentationSystemPrompt({ styleMode })
    : outputMode === 'cinematic-flow'
      ? buildCinematicFlowSystemPrompt({ styleMode })
      : buildPortalEditorSystemPrompt({ styleMode });
  const safeMessages = (messages || []).map(message => ({
    role: message.role,
    content: String(message.content || ''),
  }));

  let text;
  if (config.provider === 'anthropic') {
    text = await generateWithAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: config.model,
      system,
      messages: safeMessages,
      maxTokens,
    });
  } else if (config.provider === 'openai') {
    text = await generateWithOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: config.model,
      system,
      messages: safeMessages,
      maxTokens,
    });
  } else if (config.provider === 'google') {
    text = await generateWithGoogle({
      apiKey: process.env.GOOGLE_API_KEY,
      model: config.model,
      system,
      messages: safeMessages,
      maxTokens,
    });
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  if (!text) {
    throw new Error('No response text returned from AI provider');
  }

  let structured = extractStructuredJson(text);
  if (!structured) {
    const repairedText = await repairStructuredResponse({
      provider: config.provider,
      model: config.model,
      outputMode,
      originalText: text,
    });

    if (repairedText) {
      const repairedStructured = extractStructuredJson(repairedText);
      if (repairedStructured) {
        structured = repairedStructured;
        text = repairedText;
      }
    }
  }

  return {
    provider: config.provider,
    model: config.model,
    text: structured ? wrapJsonReply(structured) : text,
    structured,
    outputMode,
  };
}

async function generatePortalEditorContent(args) {
  return generateBuilderContent({ ...args, outputMode: 'portal' });
}

module.exports = {
  PROVIDER_DEFAULTS,
  STYLE_DIRECTIVES,
  PRESENTATION_THEMES,
  PRESENTATION_TRANSITIONS,
  generateBuilderContent,
  generatePortalEditorContent,
};
