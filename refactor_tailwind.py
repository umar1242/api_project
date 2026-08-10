import os
import re

DIR = 'apps/admin-mini-app/src'

REPLACEMENTS = {
    # Layout and Spacing
    r'className="flex flex-col gap-3"': 'className="section"',
    r'className="flex flex-col gap-4"': 'className="section"',
    r'className="space-y-3"': 'className="section"',
    r'className="space-y-4"': 'className="section"',
    r'className="flex items-center justify-between"': 'className="progress-section__header"',
    r'className="flex justify-between items-start mb-2"': 'className="progress-section__header"',
    r'className="text-center py-10 card empty-state glass-form"': 'className="empty-state glass-form"',
    
    # Typography & Colors
    r'className="text-xs font-semibold text-gray-600 mb-1 block"': 'className="input-label"',
    r'className="block text-xs font-semibold text-gray-600 mb-1"': 'className="input-label"',
    r'className="text-xs font-semibold text-gray-500 uppercase"': 'className="section__title"',
    
    r'className="form-input"': 'className="form-input"',
    r'className="form-textarea min-h-\[80px\]"': 'className="form-textarea"',
    r'className="form-textarea"': 'className="form-textarea"',
    
    r'className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30"': 'className="btn btn--primary btn--full glass-btn"',
    r'className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30 flex-1 dynamic-glow"': 'className="btn btn--primary btn--full glass-btn"',
    r'className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30 dynamic-glow disabled:opacity-50"': 'className="btn btn--primary btn--full glass-btn"',
    r'className="btn btn--full glass-btn shadow-lg shadow-blue-500/30"': 'className="btn btn--primary btn--full glass-btn"',
    r'className="btn btn--full bg-white text-gray-800 border border-gray-200 shadow-sm flex-1"': 'className="btn btn--secondary btn--full"',
    r'className="btn btn--full bg-gray-200 text-gray-800 mt-3"': 'className="btn btn--secondary btn--full"',
    
    # Empty states
    r'className="text-center text-gray-600 mb-6"': 'className="empty-state__desc"',
    r'className="empty-state__title text-2xl font-bold mb-2"': 'className="empty-state__title"',
    
    # Progress
    r'className="bg-gray-100 p-3 rounded-xl mb-6 break-all text-sm font-mono text-gray-800 border border-gray-200 w-full text-center"': 'style={{ background: "var(--tg-secondary)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", wordBreak: "break-all", fontFamily: "monospace", border: "1px solid var(--tg-hint)", textAlign: "center", marginBottom: "var(--space-6)" }}',
    r'className="card glass-form space-y-4"': 'className="card glass-form section"',
    
    r'className="upload-box mt-2 py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"': 'className="upload-box"',
    r'className="upload-box mt-2 py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"': 'className="upload-box"',
    
    r'className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm"': 'className="info-row"',
    r'className="text-sm font-semibold text-gray-900"': 'className="info-row__value"',
    r'className="text-xs text-gray-500"': 'className="info-row__label"',
    
    r'className="grid grid-cols-2 gap-3"': 'className="stats-grid"',
    r'className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col"': 'className="stat-card"',
    r'className="text-2xl font-bold text-gray-900"': 'className="stat-card__value"',
    
    r'className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100/20 shadow-sm mb-6"': 'className="card glass-form"',
    r'className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3"': 'className="section__title"',
    r'className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"': 'className="section__title"',
    
    r'className="flex flex-col gap-4 mb-6"': 'className="section"',
    r'className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"': 'className="card glass-form"',
    r'className="text-lg font-bold text-gray-900 mb-2"': 'style={{ fontSize: "18px", fontWeight: "bold", color: "var(--tg-text)", marginBottom: "var(--space-2)" }}',
    r'className="text-sm text-gray-600 mb-4"': 'style={{ fontSize: "14px", color: "var(--tg-hint)", marginBottom: "var(--space-4)" }}',
    r'className="text-sm text-gray-600"': 'style={{ fontSize: "14px", color: "var(--tg-hint)" }}',
    
    # Fix inline tailwind classes by stripping them completely if they are just styling handled by base CSS
    r' className="text-gray-900"': '',
    r' className="text-gray-600"': '',
    r' className="text-gray-500"': '',
    r' className="text-gray-400"': '',
    r' className="mb-4"': ' style={{ marginBottom: "var(--space-4)" }}',
    r' className="mb-3"': ' style={{ marginBottom: "var(--space-3)" }}',
    r' className="mb-2"': ' style={{ marginBottom: "var(--space-2)" }}',
    r' className="mb-1"': ' style={{ marginBottom: "var(--space-1)" }}',
    r' className="mt-4"': ' style={{ marginTop: "var(--space-4)" }}',
    r' className="mt-3"': ' style={{ marginTop: "var(--space-3)" }}',
    r' className="mt-2"': ' style={{ marginTop: "var(--space-2)" }}',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    for k, v in REPLACEMENTS.items():
        content = content.replace(k, v)
        
    # Generic regex for remaining standard utility class combinations
    content = re.sub(r'className="text-lg font-bold text-gray-900"', r'style={{ fontSize: "18px", fontWeight: "bold", color: "var(--tg-text)" }}', content)
    content = re.sub(r'className="page pb-40"', r'className="page"', content)
    content = re.sub(r'className="flex gap-2"', r'style={{ display: "flex", gap: "var(--space-2)" }}', content)
    content = re.sub(r'className="flex items-center gap-2"', r'style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}', content)
    content = re.sub(r'className="flex items-center gap-3"', r'style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}', content)
    content = re.sub(r'className="flex items-start gap-2"', r'style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}', content)
    content = re.sub(r'className="flex items-center justify-between text-sm"', r'className="progress-section__header"', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk(DIR):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
