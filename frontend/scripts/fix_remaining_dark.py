import os, re

base = r'E:\lenti\PAVAN FILES\ANURAG THINGS\ATP\Travel planner\frontend\src\components\dashboard'

for fname in ['ItineraryBoard.tsx', 'ExpensePanel.tsx', 'ChatPanel.tsx', 'AISuggest.tsx']:
    path = os.path.join(base, fname)
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Container classes → glass-card
    c = re.sub(r'rounded-2xl border border-slate-700 bg-slate-900/\d+ p-(\d+)', r'glass-card p-\1', c)
    c = re.sub(r'rounded-xl border border-slate-700 bg-slate-900/\d+ p-(\d+)', r'glass-card p-\1', c)
    c = re.sub(r'rounded-xl border border-slate-700 bg-slate-950/\d+', 'glass-card', c)
    c = re.sub(r'rounded-md border border-slate-700 bg-slate-900/\d+ p-(\d+)', r'glass-card p-\1', c)
    c = re.sub(r'rounded-lg border border-slate-700 bg-slate-950/\d+ p-(\d+)', r'rounded-lg border border-slate-200 bg-white p-\1', c)
    c = re.sub(r'border-b border-slate-800 bg-slate-900/\d+', 'border-b border-slate-200 bg-slate-50', c)

    # Form inputs
    c = re.sub(r'className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"', 'className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"', c)
    c = re.sub(r'className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"', 'className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"', c)
    c = re.sub(r'className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400"', 'className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:border-brand-400 transition-colors"', c)

    # Inline input with long className
    c = re.sub(r'className="flex-1 rounded-lg border border-slate-600 bg-slate-800/40 px-3 py-2 text-sm text-slate-100"', 'className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"', c)
    c = re.sub(r'className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"', 'className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"', c)

    # Buttons
    c = re.sub(r'className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"', 'className="mt-3 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"', c)
    c = re.sub(r'className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"', 'className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition-all"', c)

    # Text colors
    c = c.replace('text-sm font-semibold text-slate-100', 'text-sm font-semibold text-slate-800')
    c = c.replace('font-semibold text-slate-100', 'font-semibold text-slate-800')
    c = c.replace('text-slate-100', 'text-slate-800')
    c = c.replace('text-slate-200', 'text-slate-600')
    c = c.replace('text-slate-300', 'text-slate-600')

    # Indigo → brand
    c = c.replace('text-indigo-400', 'text-brand-500')
    c = c.replace('text-indigo-300', 'text-brand-600')
    c = c.replace('text-indigo-200', 'text-brand-600')
    c = c.replace('text-indigo-100', 'text-brand-700')

    # Badges
    c = re.sub(r'border border-indigo-500/30 bg-indigo-500/15 text-indigo-\d+', 'bg-brand-100 text-brand-600 font-medium', c)
    c = re.sub(r'border border-emerald-500/30 bg-emerald-500/15 text-emerald-\d+', 'bg-emerald-100 text-emerald-600 font-medium', c)
    c = re.sub(r'bg-indigo-500/15 text-indigo-\d+', 'bg-brand-100 text-brand-600', c)
    c = re.sub(r'bg-emerald-500/15 text-emerald-\d+', 'bg-emerald-100 text-emerald-600', c)

    # Tables
    c = re.sub(r'divide-y divide-slate-800 text-left text-sm', 'divide-y divide-slate-100 text-left text-sm', c)
    c = re.sub(r'divide-y divide-slate-800', 'divide-y divide-slate-200', c)
    c = re.sub(r'odd:bg-slate-900/\d+ even:bg-slate-950/\d+', 'odd:bg-slate-50 even:bg-white', c)

    # Chat bubble
    c = re.sub(r'className="max-w-\[70%\] rounded-xl bg-slate-800/60 p-3 text-sm text-slate-800"', 'className="max-w-[70%] rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-slate-800"', c)

    # Rose error text
    c = c.replace('text-rose-300', 'text-coral-500')
    c = c.replace('text-emerald-200', 'text-emerald-600')
    c = c.replace('text-emerald-400', 'text-emerald-500')

    # Section wrapper for ChatPanel
    c = re.sub(r'className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/\d+ p-4"', 'className="mt-6 glass-card p-4"', c)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'{fname} fully cleaned')

print('Done!')
