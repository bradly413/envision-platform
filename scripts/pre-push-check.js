const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');

function readStdin() {
  if (process.stdin.isTTY) return Promise.resolve('');
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', () => resolve(''));
  });
}

function extractCommand(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.command === 'string') return payload.command;
  const input = payload.tool_input || payload.input;
  if (input && typeof input.command === 'string') return input.command;
  return '';
}

function isHookPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return Boolean(
    payload.command ||
    payload.tool_name ||
    payload.tool_input ||
    payload.hook_event_name ||
    payload.conversation_id ||
    payload.cwd
  );
}

function runChecks() {
  const lines = [];
  let errors = 0;

  lines.push('Backend JS syntax check...');
  lines.push('');

  const dirs = [
    '',              // index.js
    'routes',
    'services',
    'middleware',
    'config',
  ];

  for (const dir of dirs) {
    const full = path.join(BACKEND, dir);
    if (!existsSync(full)) continue;

    const files = dir === ''
      ? ['index.js']
      : readdirSync(full).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(full, file);
      if (!existsSync(filePath)) continue;

      try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        lines.push(`  OK  ${dir ? dir + '/' : ''}${file}`);
      } catch (e) {
        lines.push(`  ERR ${dir ? dir + '/' : ''}${file}`);
        lines.push(`      ${e.stderr.toString().trim().split('\n')[0]}`);
        errors++;
      }
    }
  }

  lines.push('');
  lines.push('Env var check...');
  lines.push('');

  const EXPECTED_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ADMIN_URL',
    'PORTAL_URL',
    'CLOUDINARY_CLOUD_NAME',
    'ANTHROPIC_API_KEY',
  ];

  const missing = EXPECTED_VARS.filter(v => !process.env[v]);

  if (missing.length > 0) {
    lines.push('  WARN Missing env vars (verify these exist in Railway dashboard):');
    for (const v of missing) {
      lines.push(`       - ${v}`);
    }
  } else {
    lines.push('  OK  All expected env vars present');
  }

  lines.push('');
  if (errors > 0) {
    lines.push(`FAILED: ${errors} syntax error(s). Fix before pushing.`);
  } else {
    lines.push('PASSED: All checks clean.');
  }

  return { errors, lines };
}

function emitHook(permission, message) {
  const body = { permission };
  if (message) {
    body.user_message = message;
    body.agent_message = message;
  }
  process.stdout.write(`${JSON.stringify(body)}\n`);
}

async function main() {
  const raw = (await readStdin()).trim();
  let payload = null;
  if (raw.startsWith('{')) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (isHookPayload(payload)) {
    const command = extractCommand(payload);
    const isPush = /\bgit\s+push\b/.test(command);
    if (!isPush) {
      emitHook('allow');
      return;
    }
    const { errors, lines } = runChecks();
    if (errors > 0) {
      emitHook('deny', lines.join('\n'));
      return;
    }
    emitHook('allow');
    return;
  }

  const { errors, lines } = runChecks();
  for (const line of lines) console.log(line);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  if (!process.stdin.isTTY) {
    emitHook('allow');
    return;
  }
  process.exit(1);
});
