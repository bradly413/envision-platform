#!/bin/bash
# Envision pre-push safety check
# Catches the most common crash patterns before they reach Railway or the browser

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

echo "Envision safety check..."
echo ""

# ─── 1. Backend: Node syntax check (catches all JS errors) ────
echo "Backend JS:"
for f in \
  "$ROOT/backend/src/index.js" \
  "$ROOT/backend/src/routes/"*.js \
  "$ROOT/backend/src/services/"*.js \
  "$ROOT/backend/src/middleware/"*.js \
  "$ROOT/backend/src/config/"*.js; do
  [ -f "$f" ] || continue
  if node --check "$f" 2>/dev/null; then
    echo "  OK  $(basename $f)"
  else
    echo "  ERR $(basename $f)"
    node --check "$f" 2>&1 | grep -v "^$" | head -4 | sed 's/^/      /'
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── 2. Frontend JSX: targeted crash pattern detection ────────
echo ""
echo "Frontend JSX:"
for f in "$ROOT/admin-dashboard/src/pages/"*.jsx "$ROOT/admin-dashboard/src/lib/"*.js; do
  [ -f "$f" ] || continue
  fname="$(basename $f)"
  FILE_ERRORS=0

  # Check 1: unmatched backticks (template literal not closed)
  # Count backticks — odd number = unterminated template literal
  BTICKS=$(grep -o '`' "$f" | wc -l | tr -d ' ')
  if [ $((BTICKS % 2)) -ne 0 ]; then
    echo "  ERR $fname — odd number of backticks ($BTICKS) — unterminated template literal"
    FILE_ERRORS=$((FILE_ERRORS + 1))
  fi

  # Check 2: duplicate function declarations (the bug that burned us)
  DUPES=$(grep -P "^  const \w+ = (async )?\(" "$f" | grep -oP "const \w+" | sort | uniq -d)
  if [ -n "$DUPES" ]; then
    echo "  ERR $fname — duplicate function declaration: $DUPES"
    FILE_ERRORS=$((FILE_ERRORS + 1))
  fi

  # Check 3: literal newlines inside single-quoted strings (common Python patch bug)
  # Look for a line that opens with ' and never closes on the same line
  if python3 -c "
import re, sys
src = open('$f').read()
# Find single-quoted strings with embedded newlines (not in JSX attributes)
# Simple heuristic: find '...\n...' pattern inside JS string context
lines = src.split('\n')
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if stripped.startswith(\"{ label:\") or stripped.startswith(\"text:\"):
        sq = stripped.count(\"'\")
        if sq % 2 != 0:
            print(f'Line {i}: possible unterminated string: {stripped[:80]}')
            sys.exit(1)
sys.exit(0)
" 2>/dev/null; then
    : # pass
  else
    echo "  ERR $fname — possible unterminated single-quoted string"
    FILE_ERRORS=$((FILE_ERRORS + 1))
  fi

  # Check 4: unmatched JSX braces check — count { vs } (rough)
  OPENS=$(grep -o '{' "$f" | wc -l | tr -d ' ')
  CLOSES=$(grep -o '}' "$f" | wc -l | tr -d ' ')
  DIFF=$((OPENS - CLOSES))
  if [ $DIFF -lt -5 ] || [ $DIFF -gt 5 ]; then
    echo "  WARN $fname — brace mismatch: $OPENS { vs $CLOSES } (diff=$DIFF)"
    # Don't count as error — JSX can have legitimate mismatches in strings
  fi

  if [ $FILE_ERRORS -eq 0 ]; then
    echo "  OK  $fname"
  fi

  ERRORS=$((ERRORS + FILE_ERRORS))
done

# ─── 3. Summary ───────────────────────────────────────────────
echo ""
if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS error(s) found. Fix before pushing."
  exit 1
else
  echo "PASSED: All checks clean."
fi
