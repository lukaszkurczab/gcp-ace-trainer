import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {parseOrigin,selectTarget,request} from './readNativeStartupTrace.mjs';

// Fixed dev-menu action, only on the isolated list fixture and existing iPhone17.
export async function openNativeListPerformanceMenu(metroUrl, originUrl) {
 const metro=parseOrigin(metroUrl),origin=parseOrigin(originUrl);
 if(metro.port!==origin.port)throw Error('origin_rejected');
 const response=await fetch(new URL('/json/list',metro),{signal:AbortSignal.timeout(5000),redirect:'error'});
 if(!response.ok)throw Error('discovery_failed');
 const body=await response.text();if(body.length>65536)throw Error('target_rejected');
 const endpoint=selectTarget(JSON.parse(body),metro);
 const WebSocket=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url))('ws');
 const socket=new WebSocket(endpoint,{origin:origin.origin,handshakeTimeout:5000,maxPayload:131072,followRedirects:false});
 try{
  await new Promise((accept,reject)=>{socket.once('open',accept);socket.once('error',()=>reject(Error('connect_failed')));});
  const result=await request(socket,1,'Runtime.evaluate',{expression:'(()=>{if(!globalThis.HermesInternal||!globalThis[Symbol.for("patternly.perf06.list-measurement.v1")])return "fixture_unavailable";const menu=globalThis.nativeModuleProxy?.DevMenu;if(typeof menu?.show!=="function")return "native_menu_unavailable";menu.show();return "native_menu_requested";})()',returnByValue:true,silent:true});
  if(result.error||result.result?.exceptionDetails)throw Error('native_menu_failed');
  const stage=result.result?.result?.value;
  if(!['fixture_unavailable','native_menu_unavailable','native_menu_requested'].includes(stage))throw Error('native_menu_failed');
  return {schema:'patternly.perf06.native-menu.v1',stage};
 }finally{socket.terminate();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [metro,origin,...extra]=process.argv.slice(2);
 if(!metro||!origin||extra.length){console.error('arguments_rejected');process.exitCode=1;}
 else openNativeListPerformanceMenu(metro,origin).then(result=>{console.log(JSON.stringify(result));if(result.stage!=='native_menu_requested')process.exitCode=1;}).catch(()=>{console.error('native_menu_probe_failed');process.exitCode=1;});
}
