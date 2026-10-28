/** Capture-only8D.2 helper. Existing local DEV smoke runtime, never opens/changes learning data.
 * Run from APP root, with Metro8083 and the existing iPhone17 app already running:
 * node scripts/qa/8d2Presentation.mjs read > PRIVATE_RUNTIME_JSON
 * node scripts/qa/8d2Presentation.mjs locale pl > PRIVATE_RECEIPT_JSON
 * xcrun simctl ui EXISTING_UDID appearance dark
 * xcrun simctl ui EXISTING_UDID content_size large
 * maestro --device EXISTING_UDID test --test-output-dir PRIVATE_OUTPUT -e VARIANT=pl-dark-standard -e LIMIT_COPY=EXACT_LOCALE_RESOURCE_VALUE scripts/qa/8d2-recovery-three.yaml
 * locale action sets only two native app-domain presentation preferences and i18n; no canonical settings write.
 * This run's restore is valid only for the recorded original: both app-domain keys absent, i18n en.
 * node scripts/qa/8d2Presentation.mjs restore > PRIVATE_RECEIPT_JSON
 * Follow restore with read and an on-disk check of key absence; restore original OS theme/text separately.
 * JSON output contains private runtime identifiers: redirect to the caller's private evidence directory.
 */
import { createRequire } from 'node:module';
import { request, selectTarget } from './readNativeStartupTrace.mjs';
const [action = 'read', locale] = process.argv.slice(2);
const locales = ['pl', 'en', 'de', 'fr', 'es', 'it', 'et'];
if (!['read', 'locale', 'restore'].includes(action) || (action === 'locale' && !locales.includes(locale)) || (action !== 'locale' && locale !== undefined)) {
  process.stderr.write('Invalid capture presentation action or locale.\n');
  process.exit(2);
}
const country = { pl: 'PL', en: 'US', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', et: 'EE' };
const operation = action === 'locale'
  ? `rn.Settings.set({AppleLanguages:[${JSON.stringify(locale)}],AppleLocale:${JSON.stringify(`${locale}_${country[locale]}`)}});void i18n.changeLanguage(${JSON.stringify(locale)});`
  : action === 'restore'
    ? `rn.NativeModules.SettingsManager.deleteValues(['AppleLanguages','AppleLocale']);void i18n.changeLanguage('en');`
    : '';
const expression = `(()=>{
 if(typeof __DEV__==='undefined'||!__DEV__||!globalThis.HermesInternal)throw Error('capture_runtime_rejected');
 const load=suffix=>{const m=Array.from(__r.getModules().entries()).filter(([,v])=>v.isInitialized&&v.verboseName?.endsWith(suffix));if(m.length!==1)throw Error('capture_owner_unavailable');return __r(m[0][0]);};
 if(!load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('capture_mode_rejected');
 const rn=load('node_modules/react-native/index.js');const i18n=load('src/i18n.ts').default;
 ${operation}
 return {action:${JSON.stringify(action)},profile:load('src/storage/repositories/profileStorageRepository.ts').getActiveStorageProfileOrNull(),bundleURL:rn.NativeModules.SourceCode?.getConstants?.().scriptURL??null,settings:load('src/storage/repositories/settingsRepository.ts').readSettings(),window:rn.Dimensions.get('window'),deviceLanguages:rn.Settings.get('AppleLanguages'),deviceLocale:rn.Settings.get('AppleLocale'),osAppearance:rn.Appearance.getColorScheme(),i18n:i18n.language,dev:__DEV__,hermes:!!globalThis.HermesInternal};
})()`;
let socket;
try {
  const origin = new URL('http://localhost:8083');
  const target = selectTarget(await (await fetch(new URL('/json/list', origin))).json(), origin, 'com.lkurczab.patternly');
  const require = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url));
  const WS = require('ws');
  socket = new WS(target, { origin: 'http://127.0.0.1:8083', handshakeTimeout: 10000, maxPayload: 131072 });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', () => reject(Error('capture_connection_failed'))); });
  const result = await request(socket, 1, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
  if (result.error || result.result?.exceptionDetails || !result.result?.result?.value) throw Error('capture_evaluation_failed');
  process.stdout.write(`${JSON.stringify(result.result.result.value, null, 2)}\n`);
} catch {
  process.stderr.write('Capture presentation unavailable: check local runtime, initialized owner and exact existing app target. No automatic retry.\n');
  process.exitCode = 1;
} finally { socket?.terminate(); }
