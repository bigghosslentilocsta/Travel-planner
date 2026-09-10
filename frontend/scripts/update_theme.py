import os

base = r'E:\lenti\PAVAN FILES\ANURAG THINGS\ATP\Travel planner\frontend\src\components\dashboard'

# ─── ItineraryBoard.tsx ───
path = os.path.join(base, 'ItineraryBoard.tsx')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('className="rounded-xl border border-slate-700 bg-slate-900/70 p-3"', 'className="glass-card p-3"')
c = c.replace('className="rounded-2xl border border-slate-700 bg-slate-900/35 p-4"', 'className="glass-card p-4"')
c = c.replace('className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4"', 'className="glass-card p-4"')
c = c.replace('mb-2 block text-sm font-medium text-slate-200', 'mb-2 block text-sm font-medium text-slate-700')
c = c.replace('className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"', 'className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"', 'className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"', 'className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"')
c = c.replace('className="rounded-full border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-xs text-indigo-200"', 'className="rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-600"')
c = c.replace('font-semibold text-slate-100', 'font-semibold text-slate-800')
c = c.replace('className="rounded-lg border border-rose-500/40 p-2 text-rose-300 hover:bg-rose-500/', 'className="p-2 text-coral-400 hover:bg-coral-500/10 rounded-lg transition-colors')
c = c.replace('text-indigo-400', 'text-brand-500')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('ItineraryBoard.tsx updated')

# ─── ExpensePanel.tsx ───
path = os.path.join(base, 'ExpensePanel.tsx')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4"', 'className="glass-card p-4"')
c = c.replace('className="rounded-xl border border-slate-700 bg-slate-900/35 p-3"', 'className="glass-card p-3"')
c = c.replace('className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"', 'className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"', 'className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"', 'className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"')
c = c.replace('mb-2 block text-sm font-medium text-slate-200', 'mb-2 block text-sm font-medium text-slate-700')
c = c.replace('text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')
c = c.replace('text-indigo-400', 'text-brand-500')
c = c.replace('text-sm text-slate-300', 'text-sm text-slate-600')
c = c.replace('border border-indigo-500/30 bg-indigo-500/15 text-indigo-200', 'bg-brand-100 text-brand-600 font-medium')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('ExpensePanel.tsx updated')

# ─── ChatPanel.tsx ───
path = os.path.join(base, 'ChatPanel.tsx')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4"', 'className="glass-card p-4"')
c = c.replace('className="rounded-xl border border-slate-700 bg-slate-900/35 p-3"', 'className="glass-card p-3"')
c = c.replace('className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"', 'className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"', 'className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"', 'className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"')
c = c.replace('mb-2 block text-sm font-medium text-slate-200', 'mb-2 block text-sm font-medium text-slate-700')
c = c.replace('text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')
c = c.replace('text-indigo-400', 'text-brand-500')
c = c.replace('text-sm text-slate-300', 'text-sm text-slate-600')
c = c.replace('bg-indigo-500/15 text-indigo-200', 'bg-brand-100 text-brand-600')
c = c.replace('bg-emerald-500/15 text-emerald-200', 'bg-emerald-100 text-emerald-600')
c = c.replace('border border-indigo-500/30 bg-indigo-500/15 text-indigo-200', 'bg-brand-100 text-brand-600 font-medium')
c = c.replace('border border-emerald-500/30 bg-emerald-500/15 text-emerald-200', 'bg-emerald-100 text-emerald-600 font-medium')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('ChatPanel.tsx updated')

# ─── AISuggest.tsx ───
path = os.path.join(base, 'AISuggest.tsx')
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4"', 'className="glass-card p-4"')
c = c.replace('className="rounded-xl border border-slate-700 bg-slate-900/35 p-3"', 'className="glass-card p-3"')
c = c.replace('className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"', 'className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"')
c = c.replace('className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"', 'className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"')
c = c.replace('text-sm font-medium text-slate-200', 'text-sm font-medium text-slate-700')
c = c.replace('text-indigo-400', 'text-brand-500')
c = c.replace('text-sm text-slate-300', 'text-sm text-slate-600')
c = c.replace('border border-indigo-500/30 bg-indigo-500/15 text-indigo-200', 'bg-brand-100 text-brand-600 font-medium')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('AISuggest.tsx updated')

print('All dashboard components updated!')
