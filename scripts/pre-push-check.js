const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
let errors = 0;
const log = (...args) => console.error(...args);

// ─── 1. Backend syntax check ───────────────────────────────────
log('Backend JS syntax check...\n');

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
      log(`  OK  ${dir ? dir + '/' : ''}${file}`);
    } catch (e) {
      log(`  ERR ${dir ? dir + '/' : ''}${file}`);
      log(`      ${e.stderr.toString().trim().split('\n')[0]}`);
      errors++;
    }
  }
}

// ─── 2. Railway env var parity check ────────────────────────────
log('\nEnv var check...\n');

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
  log('  WARN Missing env vars (verify these exist in Railway dashboard):');
  for (const v of missing) {
    log(`       - ${v}`);
  }
} else {
  log('  OK  All expected env vars present');
}

// ─── 3. Summary ─────────────────────────────────────────────────
if (errors > 0) {
  log('');
  log(`FAILED: ${errors} syntax error(s). Fix before pushing.`);
  process.stdout.write(JSON.stringify({
    permission: 'deny',
    user_message: `Backend syntax check failed with ${errors} error(s).`,
    agent_message: 'Fix backend syntax errors before running shell commands or pushing.',
  }));
  process.exit(2);
} else {
  log('');
  log('PASSED: All checks clean.');
  process.stdout.write(JSON.stringify({ permission: 'allow' }));
}
