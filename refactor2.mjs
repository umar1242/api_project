import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS = [
  'admin-mini-app',
  'cert-mini-app',
  'main-mini-app',
  'homework-mini-app',
  'material-mini-app'
];

for (const app of APPS) {
  console.log(`Processing ${app}...`);
  const appDir = path.join(__dirname, 'apps', app);
  
  // 1. Update package.json
  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@shared-ui/core'] = '*';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // 2. Update tsconfig.app.json to NOT include shared-ui anymore because it's a package!
  // No changes needed unless we had aliases before. Let's make sure there are no @shared aliases.
  const tsconfigPath = path.join(appDir, 'tsconfig.app.json');
  if (fs.existsSync(tsconfigPath)) {
    let tsconfig = fs.readFileSync(tsconfigPath, 'utf8');
    tsconfig = tsconfig.replace(/"@shared\/\*": \["\.\.\/\.\.\/packages\/shared-ui\/src\/\*"\]/g, '');
    fs.writeFileSync(tsconfigPath, tsconfig);
  }

  const vitePath = path.join(appDir, 'vite.config.ts');
  if (fs.existsSync(vitePath)) {
    let vite = fs.readFileSync(vitePath, 'utf8');
    vite = vite.replace(/'@shared': path\.resolve\(__dirname, '\.\.\/\.\.\/packages\/shared-ui\/src'\)/g, '');
    fs.writeFileSync(vitePath, vite);
  }

  // 3. Update api/client.ts
  const clientPath = path.join(appDir, 'src/api/client.ts');
  if (fs.existsSync(clientPath)) {
    const clientCode = `import { createApiClient } from '@shared-ui/core';\n\nexport const apiClient = createApiClient(import.meta.env.VITE_API_URL ?? '/api');\n`;
    fs.writeFileSync(clientPath, clientCode);
  }

  // 4. Wrap useTelegramUser
  const useTGUPath = path.join(appDir, 'src/hooks/useTelegramUser.ts');
  if (fs.existsSync(useTGUPath)) {
    const code = `import { useTelegramUser as useSharedTelegramUser } from '@shared-ui/core';\nimport { getUserByTelegramId } from '../api';\nimport type { UserProfile } from '../types';\n\nexport const useTelegramUser = () => useSharedTelegramUser<UserProfile>(getUserByTelegramId);\n`;
    fs.writeFileSync(useTGUPath, code);
  }

  // 5. Update BottomNav
  const bottomNavPath = path.join(appDir, 'src/components/BottomNav.tsx');
  if (fs.existsSync(bottomNavPath)) {
    let code = fs.readFileSync(bottomNavPath, 'utf8');
    // Extract NAV_ITEMS
    if (code.includes('NAV_ITEMS')) {
      code = code.replace(/import \{ NavLink \} from 'react-router-dom';/, `import { BottomNav as SharedBottomNav } from '@shared-ui/core';`);
      
      const exportRegex = /export const BottomNav: React\.FC.*?\(\n\s*<nav[\s\S]*?\);\n/m;
      if (exportRegex.test(code)) {
        code = code.replace(
          exportRegex,
          `export const BottomNav: React.FC = () => <SharedBottomNav items={NAV_ITEMS} />;\n`
        );
      }
      fs.writeFileSync(bottomNavPath, code);
    }
  }

  // Handle cert-mini-app App.tsx BottomNav
  if (app === 'cert-mini-app') {
    const appTsxPath = path.join(appDir, 'src/App.tsx');
    if (fs.existsSync(appTsxPath)) {
      let appTsx = fs.readFileSync(appTsxPath, 'utf8');
      if (!appTsx.includes('@shared-ui/core')) {
        appTsx = `import { BottomNav as SharedBottomNav } from '@shared-ui/core';\n` + appTsx;
        const bottomNavRegex = /function BottomNav\(\) \{[\s\S]*?return \([\s\S]*?<\/nav>\s*\);\n\}/m;
        
        appTsx = appTsx.replace(bottomNavRegex, `const NAV_ITEMS = [
  { to: '/tests', label: 'Tests', icon: '📝' },
  { to: '/leaderboard', label: 'Rating', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

function BottomNav() {
  return <SharedBottomNav items={NAV_ITEMS as any} />;
}`);
        fs.writeFileSync(appTsxPath, appTsx);
      }
    }
  }

  // 6. Delete Loader.tsx as it is purely presentational
  const loaderPath = path.join(appDir, 'src/components/Loader.tsx');
  if (fs.existsSync(loaderPath)) {
    fs.unlinkSync(loaderPath);
  }

  // 7. Update all imports in src to point to @shared-ui/core for Loader
  const replaceImports = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        replaceImports(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        let code = fs.readFileSync(fullPath, 'utf8');
        let changed = false;
        
        // We only moved Loader.tsx fully. useTelegramUser and BottomNav are wrapped locally.
        const loaderRegex1 = /import\s+\{\s*Loader\s*\}\s+from\s+['"](?:\.\.\/|\.\/)+components\/Loader['"]/g;
        if (loaderRegex1.test(code)) {
          code = code.replace(loaderRegex1, `import { Loader } from '@shared-ui/core'`);
          changed = true;
        }
        
        if (changed) {
          fs.writeFileSync(fullPath, code);
        }
      }
    }
  };
  replaceImports(path.join(appDir, 'src'));

}
