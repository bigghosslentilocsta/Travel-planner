import os, re
root = r'E:\lenti\PAVAN FILES\ANURAG THINGS\ATP\Travel planner\frontend\src'

# ── 1) Dark-mode class scan ───────────────────────────────────────────────
patterns = [
    'bg-slate-9', 'bg-slate-8',
    'text-slate-100', 'text-slate-200', 'text-slate-300',
    'border-slate-7', 'border-slate-8', 'border-slate-6',
    'bg-emerald-9', 'bg-emerald-95', 'text-emerald-100', 'text-emerald-200', 'text-emerald-300',
    'bg-amber-9', 'text-amber-100',
    'bg-rose-9', 'text-rose-100', 'text-rose-200', 'text-rose-300',
    'bg-cyan-9', 'bg-blue-9', 'bg-purple-9', 'bg-teal-9',
]

hit_texts = []
for dp, dn, fn in os.walk(root):
    for f in sorted(fn):
        if f.endswith(('.tsx', '.ts', '.css', '.html')):
            p = os.path.join(dp, f)
            c = open(p, encoding='utf-8').read()
            for i, l in enumerate(c.split('\n'), 1):
                m = set(re.findall('|'.join(patterns), l))
                for tag in m:
                    rel = os.path.relpath(p, root).replace('\\', '/')
                    hit_texts.append(f'DARK {rel}:{i} [{tag}] {l.strip()[:100]}')

# ── 2) Non-standard opacity modifier scan (vs default Tailwind scale) ───
scale = {'0', '5', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100'}
op_issues = []
for dp, dn, fn in os.walk(root):
    for f in sorted(fn):
        if f.endswith(('.tsx', '.ts')):
            p = os.path.join(dp, f)
            for i, l in enumerate(open(p, encoding='utf-8').read().split('\n'), 1):
                for m in re.finditer(r'/(\d+)\b', l):
                    v = m.group(1)
                    if v not in scale and int(v) < 100:
                        rel = os.path.relpath(p, root).replace('\\', '/')
                        op_issues.append(f'OPACITY {rel}:{i} /{v} -> {l.strip()[:100]}')

print('=== DARK-MODE CLASS SCAN ===')
if hit_texts:
    print('\n'.join(hit_texts))
else:
    print('None found - src/ is clean of dark-mode classes.')
print()
print('=== OPACITY MODIFIER AUDIT ===')
if op_issues:
    print('\n'.join(op_issues))
else:
    print('No non-standard opacity modifiers found.')