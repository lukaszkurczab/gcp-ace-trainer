// Usage: node scripts/qa/startSoloHome23Fixture.mjs <private smoke environment JSON>
// JS-only fixture for the existing dev client; no install/reset/profile bootstrap.
import { readFileSync, statSync, mkdtempSync, cpSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
try {
  const environmentFile = process.argv[2];
  if (process.argv.length !== 3 || !environmentFile || (statSync(environmentFile).mode & 0o077) !== 0) throw Error();
  const environment = JSON.parse(readFileSync(environmentFile, 'utf8'));
  if (environment.PATTERNLY_RUNTIME_MODE !== 'smoke') throw Error();
  const source = fileURLToPath(new URL('../../', import.meta.url));
  const project = mkdtempSync(join(tmpdir(), 'patternly23-ui-'));
  for (const name of ['src', 'assets', 'config', 'plugins', 'scripts/qa/soloHome23', 'app.config.js', 'tsconfig.json']) cpSync(join(source, name), join(project, name), { recursive: true });
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  pkg.main = 'scripts/qa/soloHome23/fixture.tsx'; writeFileSync(join(project, 'package.json'), JSON.stringify(pkg));
  symlinkSync(resolve(source, 'node_modules'), join(project, 'node_modules'), 'dir');
  cpSync(join(source, 'metro.config.js'), join(project, 'metro.base.cjs'));
  writeFileSync(join(project, 'metro.config.js'), `
const config = require('./metro.base.cjs');
const original = config.resolver.resolveRequest;
const subjects = {
 'src/features/home/tabs/HomeTab.tsx': ['../../../preferences','../../../application/learningPlan','../../../application/certification/singleCaseRecommendation','../../../application/trainingLifecycle'],
 'src/features/home/tabs/ProgressTab.tsx': ['../../../preferences'],
 'src/features/home/tabs/SettingsTab.tsx': ['../../../preferences','../../../application/premiumTesting','../../../infrastructure/clients/patternlyBackendRuntime','../../../infrastructure/runtime/runtimeMode'],
};
config.resolver.resolveRequest = (context, name, platform) => {
 const entry = Object.entries(subjects).find(([suffix]) => context.originModulePath.endsWith(suffix));
 if(entry?.[1].includes(name)) return {type:'sourceFile',filePath:require('node:path').join(__dirname,'scripts/qa/soloHome23/ports.ts')};
 return original(context,name,platform);
};
module.exports=config;
`);
  console.log(`soloHome23 isolated fixture: ${project}`);
  const child = spawn(process.execPath, [join(project, 'node_modules/expo/bin/cli'), 'start', '--localhost', '--port', '8081'], {
    cwd: project, env: { ...process.env, ...environment, CI: '1', EXPO_OFFLINE: '1', EXPO_NO_DOTENV: '1', PATTERNLY_METRO_DISABLE_WATCHMAN: '1' }, stdio: 'inherit',
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch { console.error('solo_home_fixture_start_unavailable'); process.exitCode = 1; }
