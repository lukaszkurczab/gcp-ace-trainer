/** DEV-smoke isolated presentation capture. Redirect bounded runtime receipts to private evidence. */
import { createRequire } from 'node:module';
import { request, selectTarget } from './readNativeStartupTrace.mjs';
const [action = 'read', scene, locale, theme] = process.argv.slice(2);
if (!['read', 'scene', 'invalid', 'restore'].includes(action) || (action === 'scene' && (!scene || !locale || !theme)) || (action !== 'scene' && scene !== undefined)) throw Error('preview_capture_arguments_invalid');
const url = action === 'scene' ? `com.lkurczab.patternly://audit/startup-preview?${new URLSearchParams({ scene, locale, theme })}` : 'com.lkurczab.patternly://audit/startup-preview?scene=invalid&locale=en&theme=light';
const operation = ['scene', 'invalid'].includes(action) ? `rn.DeviceEventEmitter.emit('url',{url:${JSON.stringify(url)}});` : action === 'restore' ? `rn.NativeModules.SettingsManager.deleteValues(['AppleLanguages','AppleLocale']);void load('src/i18n.ts').default.changeLanguage('en');` : '';
const expression = `(()=>{
 if(typeof __DEV__==='undefined'||!__DEV__||!globalThis.HermesInternal)throw Error('preview_capture_runtime_rejected');
 const modules=Array.from(__r.getModules().entries());
 const load=suffix=>{const m=modules.filter(([,v])=>v.isInitialized&&v.verboseName?.endsWith(suffix));if(m.length!==1)throw Error('preview_capture_owner_unavailable');return __r(m[0][0]);};
 const rn=load('node_modules/react-native/index.js');
 const read=globalThis[Symbol.for('patternly.startup-preview-receipt.v1')];
 if(typeof read!=='function'||read().entry!=='preview')throw Error('preview_capture_entry_rejected');
 ${operation}
 const forbidden=['src/RegularApplicationRoot.tsx','src/preferences/AppPreferencesProvider.tsx','src/application/account/ProfileStoragePreparationGate.tsx','src/application/account/AccountSessionProvider.tsx','src/infrastructure/storage/mmkvClient.ts','src/storage/repositories/profileStorageRepository.ts'];
 return {action:${JSON.stringify(action)},receipt:read(),safeArea:load('node_modules/react-native-safe-area-context/src/index.tsx').initialWindowMetrics?.insets??null,window:rn.Dimensions.get('window'),osAppearance:rn.Appearance.getColorScheme(),nativeLanguages:rn.Settings.get('AppleLanguages'),nativeLocale:rn.Settings.get('AppleLocale'),i18n:load('src/i18n.ts').default.language,forbiddenInitialized:forbidden.filter(suffix=>modules.some(([,v])=>v.isInitialized&&v.verboseName?.endsWith(suffix))),bundleURL:rn.NativeModules.SourceCode?.getConstants?.().scriptURL??null};
})()`;
let socket;
try {
 const origin=new URL('http://localhost:8083');
 const target=selectTarget(await(await fetch(new URL('/json/list',origin))).json(),origin,'com.lkurczab.patternly');
 const require=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url));
 const WS=require('ws'); socket=new WS(target,{origin:'http://127.0.0.1:8083',handshakeTimeout:10000,maxPayload:131072});
 await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',()=>reject(Error('preview_capture_connection_failed')));});
 const result=await request(socket,1,'Runtime.evaluate',{expression,returnByValue:true,silent:true});
 if(result.error||result.result?.exceptionDetails||!result.result?.result?.value)throw Error('preview_capture_evaluation_failed');
 process.stdout.write(JSON.stringify(result.result.result.value,null,2)+'\n');
} catch {process.stderr.write('Startup preview capture failed at runtime/entry/readback stage. Check the existing app and isolated Metro; no automatic retry.\n');process.exitCode=1;}
finally {socket?.terminate();}
