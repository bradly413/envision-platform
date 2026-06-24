const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const path = require('path');

if (!process.stdin.isTTY) {
  try {
    const stdin = require('fs').readFileSync(0, 'utf8').trim();
    const input = stdin ? JSON.parse(stdin) : null;

    if (input && (input.tool_name || input.hook_event_name)) {
      process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
      process.exit(0);
    }
  } catch {
    // Non-JSON stdin can come from git hooks; continue with the normal checks.
  }
}

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
let errors = 0;

// ─── 1. Backend syntax check ───────────────────────────────────
console.log('Backend JS syntax check...\n');

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
      console.log(`  OK  ${dir ? dir + '/' : ''}${file}`);
    } catch (e) {
      console.log(`  ERR ${dir ? dir + '/' : ''}${file}`);
      console.log(`      ${e.stderr.toString().trim().split('\n')[0]}`);
      errors++;
    }
  }
}

// ─── 2. Railway env var parity check ────────────────────────────
console.log('\nEnv var check...\n');

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
  console.log('  WARN Missing env vars (verify these exist in Railway dashboard):');
  for (const v of missing) {
    console.log(`       - ${v}`);
  }
} else {
  console.log('  OK  All expected env vars present');
}

// ─── 3. Summary ─────────────────────────────────────────────────
console.log('');
if (errors > 0) {
  console.log(`FAILED: ${errors} syntax error(s). Fix before pushing.`);
  process.exit(1);
} else {
  console.log('PASSED: All checks clean.');
}
