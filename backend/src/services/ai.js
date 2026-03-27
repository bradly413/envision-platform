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

const TEMPLATE_DIRECTIVES = {
  'brand-reveal-v1': `Use the classic Envision reveal structure: dramatic hero, bold section transitions, and a sense of progressive reveal from strategy to system.`,
  'brand-reveal-minimal': `Design for a restrained, gallery-like reveal. Keep copy concise, use negative space, and favor fewer, sharper moments over spectacle.`,
  'full-identity': `Design for a comprehensive identity system presentation. Include a more complete rationale across brand, logo, palette, typography, and how the pieces work together.`,
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

function getProviderConfig(provider, model) {
  const normalizedProvider = (provider || 'anthropic').toLowerCase();
  const resolvedModel = model || PROVIDER_DEFAULTS[normalizedProvider];

  if (!resolvedModel) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return { provider: normalizedProvider, model: resolvedModel };
}

function buildPortalEditorSystemPrompt({ styleMode = 'cinematic', templateId = 'brand-reveal-v1' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;
  const templateDirective = TEMPLATE_DIRECTIVES[templateId] || TEMPLATE_DIRECTIVES['brand-reveal-v1'];
  const motionKnowledge = formatMotionKnowledgeBase();

  return `You are Envision Creative's senior creative director and portal content editor.
You create client-facing presentation portal content that feels high-end, art directed, and strategically sharp.

${styleDirective}
${templateDirective}

Follow these rules:
- Write with the taste level of a senior brand strategist and design director, not a generic AI assistant.
- Avoid boilerplate agency language, startup cliches, empty adjectives, and vague claims.
- Make every section feel specific to the client, their industry, and their brand position.
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
- Respect the selected portal template and make the section framing feel materially different across templates.
- Do not recycle the same Envision Marketing headline structure unless the user's prompt explicitly asks for it.

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
  "portalTemplate": "${templateId}",
  "artDirection": "${styleMode}",
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

Return the full JSON block wrapped in triple backticks. You may include a very short explanation before the JSON, but do not omit the JSON or any keys.`;
}

function buildPresentationSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;
  const motionKnowledge = formatMotionKnowledgeBase();

  return `You are Envision Creative's senior presentation director and motion strategist.
You create client-facing cinematic presentation specs that can be rendered with reveal.js.

${styleDirective}

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

async function generateBuilderContent({
  provider,
  model,
  styleMode,
  templateId,
  outputMode = 'portal',
  messages,
  maxTokens,
}) {
  const config = getProviderConfig(provider, model);
  const system = outputMode === 'presentation'
    ? buildPresentationSystemPrompt({ styleMode })
    : buildPortalEditorSystemPrompt({ styleMode, templateId });
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

  return {
    provider: config.provider,
    model: config.model,
    text,
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
