const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
const jsonOutput = !process.stdout.isTTY;
const outputLines = [];
let errors = 0;

function print(line = '') {
  if (jsonOutput) {
    outputLines.push(line);
    return;
  }
  console.log(line);
}

// ─── 1. Backend syntax check ───────────────────────────────────
print('Backend JS syntax check...\n');

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
      print(`  OK  ${dir ? dir + '/' : ''}${file}`);
    } catch (e) {
      print(`  ERR ${dir ? dir + '/' : ''}${file}`);
      print(`      ${e.stderr.toString().trim().split('\n')[0]}`);
      errors++;
    }
  }
}

// ─── 2. Railway env var parity check ────────────────────────────
print('\nEnv var check...\n');

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
  print('  WARN Missing env vars (verify these exist in Railway dashboard):');
  for (const v of missing) {
    print(`       - ${v}`);
  }
} else {
  print('  OK  All expected env vars present');
}

// ─── 3. Summary ─────────────────────────────────────────────────
print('');
if (errors > 0) {
  print(`FAILED: ${errors} syntax error(s). Fix before pushing.`);
  if (jsonOutput) {
    console.log(JSON.stringify({ continue: false, reason: outputLines.join('\n') }));
  }
  process.exit(1);
} else {
  print('PASSED: All checks clean.');
  if (jsonOutput) {
    console.log(JSON.stringify({ continue: true, reason: outputLines.join('\n') }));
  }
}
