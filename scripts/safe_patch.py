"""
safe_patch.py — safe file patching for Envision
Usage: python3 safe_patch.py <file> <old_string_file> <new_string_file>

Rules enforced:
- old string must appear EXACTLY ONCE in the file
- result must parse without syntax errors (JS/JSX via babel, .js via node --check)
- creates a .bak backup before writing
- exits non-zero on any failure so git hook catches it
"""
import sys, os, subprocess, shutil

def check_syntax(path):
    ext = os.path.splitext(path)[1]
    if ext in ('.js', '.jsx'):
        # Try node --check first (works for plain JS)
        r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
        if r.returncode != 0 and ext == '.jsx':
            # JSX — use @babel/parser
            r = subprocess.run(['node', '-e', f"""
const fs = require('fs');
const src = fs.readFileSync('{path}', 'utf8');
try {{
  require('@babel/parser').parse(src, {{ sourceType: 'module', plugins: ['jsx'] }});
  process.exit(0);
}} catch(e) {{ console.error(e.message); process.exit(1); }}
"""], capture_output=True, text=True)
        if r.returncode != 0:
            print(f"SYNTAX ERROR in {path}:")
            print(r.stderr[:500])
            return False
    return True

def patch(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()
    
    count = content.count(old)
    if count == 0:
        print(f"ERROR: old string not found in {filepath}")
        sys.exit(1)
    if count > 1:
        print(f"ERROR: old string appears {count} times (must be exactly 1) in {filepath}")
        sys.exit(1)
    
    # Backup
    shutil.copy2(filepath, filepath + '.bak')
    
    patched = content.replace(old, new, 1)
    with open(filepath, 'w') as f:
        f.write(patched)
    
    if not check_syntax(filepath):
        # Restore backup
        shutil.copy2(filepath + '.bak', filepath)
        print(f"Syntax check failed — restored backup")
        sys.exit(1)
    
    os.remove(filepath + '.bak')
    print(f"Patched {filepath} successfully")

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: safe_patch.py <file> <old.txt> <new.txt>")
        sys.exit(1)
    filepath = sys.argv[1]
    with open(sys.argv[2]) as f: old = f.read()
    with open(sys.argv[3]) as f: new = f.read()
    patch(filepath, old, new)
