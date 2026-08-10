import os
import re

APPS = [
    "apps/admin-mini-app/src/index.css",
    "apps/cert-mini-app/src/index.css",
    "apps/homework-mini-app/src/index.css",
    "apps/main-mini-app/src/index.css",
    "apps/material-mini-app/src/index.css",
    "apps/registrar-mini-app/src/index.css",
]

def patch_css(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
        
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace .btn
    btn_replacement = """.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 12px var(--space-5);
  border-radius: var(--radius-xl);
  font-size: 16px;
  font-weight: 700;
  transition: opacity var(--transition), transform var(--transition);
  box-shadow: var(--shadow-clay-btn);
}"""
    content = re.sub(r'\.btn\s*\{\s*display: inline-flex;[^}]+\}', btn_replacement, content, flags=re.MULTILINE)
    
    # Replace .lesson-card
    lesson_card_replacement = """.lesson-card {
  background: var(--tg-bg);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-clay-card);
  border: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: transform var(--transition), box-shadow var(--transition);
}"""
    content = re.sub(r'\.lesson-card\s*\{[^}]+\}', lesson_card_replacement, content, flags=re.MULTILINE)
    
    # Replace .stat-card
    stat_card_replacement = """.stat-card {
  background: var(--tg-bg);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-clay-card);
  border: none;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}"""
    content = re.sub(r'\.stat-card\s*\{[^}]+\}', stat_card_replacement, content, flags=re.MULTILINE)
    
    # Replace .profile-hero__avatar
    avatar_replacement = """.profile-hero__avatar {
  width: 72px;
  height: 72px;
  border-radius: 28px;
  background: linear-gradient(135deg, #8B78FF 0%, #6B4EFF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: var(--shadow-clay-btn);
}"""
    content = re.sub(r'\.profile-hero__avatar\s*\{[^}]+\}', avatar_replacement, content, flags=re.MULTILINE)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

for app in APPS:
    patch_css(app)
