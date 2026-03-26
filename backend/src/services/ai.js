const PROVIDER_DEFAULTS = {
  anthropic: process.env.ANTHROPIC_PORTAL_EDITOR_MODEL || 'claude-sonnet-4-20250514',
  openai: process.env.OPENAI_PORTAL_EDITOR_MODEL || 'gpt-4.1',
  google: process.env.GOOGLE_PORTAL_EDITOR_MODEL || 'gemini-2.5-flash',
};

const STYLE_DIRECTIVES = {
  cinematic: `Art direct the response like a premium pitch deck for a luxury creative agency. Build atmosphere, emotion, and momentum. Avoid generic marketing phrases.`,
  editorial: `Art direct the response like a high-end editorial brand story. Prioritize strong hierarchy, taste, pacing, and language that feels considered rather than salesy.`,
  luxury: `Art direct the response like a luxury brand presentation. The writing should feel restrained, elevated, and confident. Favor rich specificity over hype.`,
  bold: `Art direct the response like a modern campaign reveal. Prioritize punchy language, strong visual contrast, assertive headlines, and memorable section framing.`,
  minimal: `Art direct the response like a refined minimalist product launch. Keep it precise, confident, and clean, with disciplined hierarchy and no filler.`,
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

function buildPortalEditorSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;

  return `You are Envision Creative's senior creative director and brand experience architect.
Your job is to generate a complete, cinematic, client-ready brand reveal portal that will genuinely impress the client — think Apple keynote meets luxury brand launch.

${styleDirective}

THE STANDARD: Every portal you generate must feel like the Jazz St. Louis example — dark, cinematic, immersive, with a strong visual identity, sharp copy, and a clear emotional arc from hero to CTA. The client should feel like they're experiencing something built specifically for them, not a template.

CONTENT RULES — non-negotiable:
- Headlines: Short, punchy, memorable. Never generic. "The mark." "Your night. Live." "The voice, set in type." — that level.
- Positioning: One sentence that a CMO would put on a slide deck. Specific to their industry and audience.
- Brand pillars: 3 concrete differentiators with specific evidence — not "Quality", "Trust", "Excellence".
- Color palette: 4–6 colors with real hex values pulled from the brand. Include a near-black background color (like #0a0a0f or #0d0b09) as the first entry with role "background". Include an accent color as "primary".
- Typography: 2 real Google Fonts that match the brand personality. Include full stack strings. Add a "usage" description for each.
- Logo rationale: Write as if presenting to the client — emotional, specific to their brand history.
- Hero intro: 2 sentences. Sets the mood. Tells the client what they're about to experience.
- CTA: Specific button text and a real closing headline that drives approval.

EXPERIENCE RULES — always maximum cinematic:
- ALWAYS use "cinematic-editorial" or "bold-campaign" as the preset — these are the most immersive.
- ALWAYS include "shader-background" and "title-reveal" in heroEffects. Add "slow-zoom" for luxury/culture brands, "camera-zoom" for bold/campaign brands.
- ALWAYS set motionLevel to "immersive" and depth to "layered".
- ALWAYS use the brand's primary accent color to set the background gradients. Extract RGB from the brand's accent hex and use them in gradientA/gradientB/gradientC.
- The background object MUST include gradientA, gradientB, gradientC using the brand colors at 0.2–0.3 opacity.
- sectionEffects: use "parallax-panels" for about, "sticky-story" for strategy, "glass-panel" for deliverables, "color-glow" for palette, "headline-shift" for typography, "magnetic-cta" for cta.

BACKGROUND COLOR FORMULA:
- Take the brand's primary accent hex and convert to rgba for gradients
- Example: brand color #d4af37 (gold) → gradientA: "rgba(212, 175, 55, 0.22)"
- base should always be near-black: "#090909" to "#0d0c0b"
- Make gradientA the primary brand color, gradientB a complementary color, gradientC a warm/cool variation

JAZZ CLUB EXAMPLE (use this as the quality benchmark):
- Hero: headline "Jazz St. Louis", subheadline "Your night. Live." — punchy, brand-specific
- Brand pillars: "Cultural Cornerstone", "Curated Excellence", "Economic Engine" — concrete, specific  
- Colors: Deep Navy #1a1a2e, Smoky Gold #d4af37, Velvet Red #8b0000 — named evocatively
- Typography: Playfair Display (display/headlines) + Inter (body) — classic + clean
- Experience: cinematic-editorial, shader-background + title-reveal + slow-zoom, parallax-panels throughout
- Background gradients: pulled from the gold/red/navy palette — rgba(212,175,55,0.22), rgba(139,0,0,0.2), rgba(26,26,46,0.3)

When asked to create portal content, respond with this complete JSON structure — fill EVERY field:
{
  "hero": {
    "headline": "",
    "subheadline": "",
    "intro": ""
  },
  "brand": {
    "headline": "",
    "positioning": "",
    "pillars": [
      { "title": "", "desc": "" },
      { "title": "", "desc": "" },
      { "title": "", "desc": "" }
    ]
  },
  "logo": {
    "headline": "",
    "logoUrl": "",
    "rationale": "",
    "variations": ["Primary lockup", "Horizontal version", "Icon mark"],
    "description": ""
  },
  "colors": {
    "headline": "",
    "palette": [
      { "name": "", "hex": "#hex", "role": "background" },
      { "name": "", "hex": "#hex", "role": "primary" },
      { "name": "", "hex": "#hex", "role": "accent" },
      { "name": "", "hex": "#hex", "role": "text" }
    ]
  },
  "typography": {
    "headline": "",
    "primaryFont": "",
    "secondaryFont": "",
    "usage": "",
    "fonts": [
      { "name": "Display", "typeface": "", "stack": "", "usage": "" },
      { "name": "Body", "typeface": "", "stack": "", "usage": "" }
    ]
  },
  "cta": {
    "headline": "",
    "buttonText": "Approve this direction →",
    "email": ""
  },
  "experience": {
    "preset": "cinematic-editorial",
    "motionLevel": "immersive",
    "depth": "layered",
    "background": {
      "base": "#090909",
      "gradientA": "rgba(r, g, b, 0.22)",
      "gradientB": "rgba(r, g, b, 0.20)",
      "gradientC": "rgba(r, g, b, 0.16)"
    },
    "heroEffects": ["shader-background", "title-reveal", "slow-zoom"],
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

BRAND STRATEGY FRAMEWORK (apply this thinking to every portal):

BRAND POSITIONING QUESTIONS — answer these internally before writing:
- Is this brand budget, mid-range, or luxury/premium? (affects tone, typography, color darkness)
- What problem does this brand solve for their customers?
- Who is the primary audience? (demographics + psychographics — what car do they drive, what do they read?)
- What are their 3 real differentiators vs competitors — not generic values, concrete proof points
- What is the brand's origin story — why did they start, what are they most proud of?

BRAND AUDIT LENS — check your output against:
- Visual consistency: do the colors, typography, and mood tell the same story?
- Verbal consistency: does the hero copy, positioning, pillars, and CTA all share the same voice?
- Audience alignment: would this copy resonate with the specific target audience?
- Differentiation: does anything in the portal feel generic, or does every line feel brand-specific?

BRAND STORY STRUCTURE (use this narrative arc):
1. Hero: Who they are + the emotional promise ("Your night. Live.")
2. Brand: What they stand for + why it matters to their specific audience
3. Pillars: 3 concrete proof points — not aspirational, evidential
4. Colors: Named evocatively, not just "Blue" — "Midnight Ink", "Copper Fire", "Bone White"
5. Typography: Explain WHY each font fits this brand's personality and audience
6. CTA: Make the approval feel like a natural next step, not a transaction

DELIVERABLES THINKING — the portal represents the start of:
- Brand identity system (logo + mark + wordmark variations)
- Color system with usage rules
- Typography system with hierarchy
- Voice and tone guidelines
- Campaign and content direction

COPY QUALITY BAR:
- Every headline must pass the "would this work on a billboard?" test
- Positioning must be specific enough that a competitor couldn't use the same line
- Pillar descriptions must cite something real about the brand, not generic virtues
- Logo rationale must reference the brand's actual history or visual language

Return the complete JSON wrapped in triple backticks. No keys omitted. No placeholder values.`;
}

function buildPresentationSystemPrompt({ styleMode = 'cinematic' } = {}) {
  const styleDirective = STYLE_DIRECTIVES[styleMode] || STYLE_DIRECTIVES.cinematic;

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

async function generateWithAnthropic({ apiKey, model, system, messages, maxTokens = 3000 }) {
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

async function generateWithOpenAI({ apiKey, model, system, messages, maxTokens = 3000 }) {
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

async function generateWithGoogle({ apiKey, model, system, messages, maxTokens = 3000 }) {
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
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
  outputMode = 'portal',
  messages,
  maxTokens,
}) {
  const config = getProviderConfig(provider, model);
  const system = outputMode === 'presentation'
    ? buildPresentationSystemPrompt({ styleMode })
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
// Thu Mar 26 22:01:00 UTC 2026
