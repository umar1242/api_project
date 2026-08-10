import os
import re

CSS_ROOT_REPLACE = """
:root {
  /* Telegram theme fallbacks (Claymorphism overrides) */
  --tg-bg:         #FFFFFF;
  --tg-text:       #1E1E1E;
  --tg-hint:       #8C8C8C;
  --tg-link:       #8B78FF;
  --tg-btn:        #8B78FF;
  --tg-btn-text:   #FFFFFF;
  --tg-secondary:  #F4F5F9;
  --tg-accent:     #FFB23F;
  --tg-destructive:#FF6B6B;

  /* Design tokens */
  --radius-sm:  12px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --radius-full: 9999px;

  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;

  --shadow-sm: 4px 4px 8px rgba(0,0,0,0.04), -4px -4px 8px #ffffff;
  --shadow-md: 8px 8px 20px rgba(0,0,0,0.05), -8px -8px 20px #ffffff;
  --shadow-lg: 12px 12px 30px rgba(0,0,0,0.06), -12px -12px 30px #ffffff;
  
  --shadow-clay-btn: 4px 4px 12px rgba(139,120,255,0.3), inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.1);
  --shadow-clay-card: 10px 10px 24px rgba(0,0,0,0.05), -10px -10px 24px #ffffff, inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(0,0,0,0.02);
  --shadow-clay-inset: inset 4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,1);

  --transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Semantic colors */
  --color-success:  #4ADE80;
  --color-warning:  #FFB23F;
  --color-error:    var(--tg-destructive);
  --color-info:     var(--tg-btn);

  /* Bottom nav height — used for main padding */
  --nav-height: 80px;
}
"""

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

    # Replace :root
    content = re.sub(r':root\s*\{[^}]+\}', CSS_ROOT_REPLACE.strip(), content, flags=re.MULTILINE)
    
    # Replace .card
    card_replacement = """.card {
  background: var(--tg-bg);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-clay-card);
  border: none;
}"""
    content = re.sub(r'\.card\s*\{[^}]+\}', card_replacement, content, flags=re.MULTILINE)
    
    # Replace .btn--primary
    btn_primary_replacement = """.btn--primary {
  background: linear-gradient(135deg, #8B78FF 0%, #6B4EFF 100%);
  color: var(--tg-btn-text);
  border: none;
  box-shadow: var(--shadow-clay-btn);
}"""
    content = re.sub(r'\.btn--primary\s*\{[^}]+\}', btn_primary_replacement, content, flags=re.MULTILINE)

    # Replace .bottom-nav
    bottom_nav_replacement = """.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  height: var(--nav-height);
  background: rgba(255, 255, 255, 0.85);
  border-top: none;
  display: flex;
  align-items: stretch;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 100;
  box-shadow: 0 -10px 30px rgba(0,0,0,.04);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}"""
    content = re.sub(r'\.bottom-nav\s*\{[^}]+\}', bottom_nav_replacement, content, flags=re.MULTILINE)
    
    # Replace .bottom-nav__icon
    bottom_nav_icon_replacement = """.bottom-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xl);
  transition: all var(--transition);
}

.bottom-nav__item--active .bottom-nav__icon {
  background: linear-gradient(135deg, #8B78FF 0%, #6B4EFF 100%);
  color: #fff;
  box-shadow: var(--shadow-clay-btn);
  transform: translateY(-4px);
}"""
    content = re.sub(r'\.bottom-nav__icon\s*\{[^}]+\}\s*\.bottom-nav__item--active \.bottom-nav__icon\s*\{[^}]+\}', bottom_nav_icon_replacement, content, flags=re.MULTILINE)

    # Replace .glass-form
    glass_form_replacement = """.glass-form {
  background: var(--tg-bg);
  border-radius: var(--radius-xl);
  border: none;
  box-shadow: var(--shadow-clay-card);
}"""
    content = re.sub(r'\.glass-form\s*\{[^}]+\}', glass_form_replacement, content, flags=re.MULTILINE)

    # Replace .form-input, .form-textarea, .form-select
    input_replacement = """.form-input, .form-textarea, .form-select {
  width: 100%;
  background: var(--tg-secondary);
  border: none;
  border-radius: var(--radius-lg);
  padding: 16px 16px;
  font-size: 15px;
  color: var(--tg-text);
  outline: none;
  transition: all var(--transition);
  box-shadow: var(--shadow-clay-inset);
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  background: #fff;
  box-shadow: var(--shadow-clay-card);
}"""
    content = re.sub(r'\.form-input, \.form-textarea, \.form-select\s*\{[^}]+\}\s*\.form-input:focus, \.form-textarea:focus, \.form-select:focus\s*\{[^}]+\}', input_replacement, content, flags=re.MULTILINE)

    # Add custom gradient text for claymorphism
    gradient_text_replacement = """.gradient-text {
  background: linear-gradient(135deg, #8B78FF 0%, #6B4EFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}"""
    content = re.sub(r'\.gradient-text\s*\{[^}]+\}', gradient_text_replacement, content, flags=re.MULTILINE)

    # Filter tab
    filter_tab_replacement = """.filter-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: 10px var(--space-3);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--tg-hint);
  transition: all var(--transition);
}

.filter-tab--active {
  background: #fff;
  color: var(--tg-btn);
  box-shadow: var(--shadow-clay-card);
}"""
    content = re.sub(r'\.filter-tab\s*\{[^}]+\}\s*\.filter-tab--active\s*\{[^}]+\}', filter_tab_replacement, content, flags=re.MULTILINE)

    # .glass-btn
    glass_btn_replacement = """.glass-btn {
  background: linear-gradient(135deg, #8B78FF 0%, #6B4EFF 100%);
  color: #fff;
  border: none;
  box-shadow: var(--shadow-clay-btn);
}"""
    content = re.sub(r'\.glass-btn\s*\{[^}]+\}', glass_btn_replacement, content, flags=re.MULTILINE)

    # .progress-bar__fill
    progress_bar_replacement = """.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #8B78FF 0%, #FFB23F 100%);
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-clay-btn);
}"""
    content = re.sub(r'\.progress-bar__fill\s*\{[^}]+\}', progress_bar_replacement, content, flags=re.MULTILINE)

    # write back
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

for app in APPS:
    patch_css(app)
