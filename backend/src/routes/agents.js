const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const db = require('../config/db');

router.use(requireAdmin);

// Run an AI agent via Claude API
router.post('/run', async (req, res) => {
  const { agent, context } = req.body;

  const PROMPTS = {
    'daily-briefing': (ctx) => `You are a creative agency operations assistant for ${ctx.agencyName}. 
      Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
      Active clients: ${ctx.clients?.map(c => `${c.name} (${c.stage})`).join(', ')}.
      Open tasks: ${ctx.openTasks || 0}. Overdue: ${ctx.overdueTasks || 0}.
      Upcoming deadlines: ${ctx.upcomingDeadlines?.join(', ') || 'none'}.
      Write a concise morning briefing (3-4 paragraphs) covering priorities, client status, and what needs attention today.`,

    'client-summary': (ctx) => `Summarize the current status of client ${ctx.client.name} (${ctx.client.company}).
      Stage: ${ctx.client.stage}. Project: ${ctx.client.project_type}. Budget: $${ctx.client.budget}.
      Recent notes: ${ctx.notes?.slice(-3).map(n => n.content).join(' | ')}.
      Open tasks: ${ctx.tasks?.filter(t => t.status !== 'done').length}.
      Write a 2-paragraph internal summary of where things stand and what the next steps are.`,

    'portal-feedback': (ctx) => `A client just reviewed their brand presentation portal.
      Client: ${ctx.clientName}. Time spent: ${ctx.sessionMinutes} minutes.
      Scroll depth: ${ctx.scrollDepth}%. Sections viewed: ${ctx.sections?.join(', ')}.
      ${ctx.approved ? 'They APPROVED the work.' : 'They have NOT approved yet.'}
      ${ctx.comments ? `Their comments: "${ctx.comments}"` : ''}
      Write a brief internal note summarizing the client's engagement and recommended next steps.`,

    'proposal-draft': (ctx) => `Draft a project proposal for ${ctx.client.name} (${ctx.client.company}).
      Project type: ${ctx.projectType}. Estimated budget: $${ctx.budget}.
      Key deliverables: ${ctx.deliverables?.join(', ')}.
      Write a professional, concise proposal outline with scope, timeline, and investment sections.`,
  };

  const promptFn = PROMPTS[agent];
  if (!promptFn) return res.status(400).json({ error: `Unknown agent: ${agent}` });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: promptFn(context) }],
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'No response from AI' });
    res.json({ result: text, agent, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
