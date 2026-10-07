#!/usr/bin/env node
// Existing initialized FileSystem only. Own nonce cache file; no canonical-store mutation.
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import WebSocket from 'ws';
const output = process.argv[2];
if (!/^docs\/active\/BIZQ-01\/premium-completion-33\/Q13-CACHE-CAPABILITY-[A-Z0-9-]+\.json$/.test(output ?? '')) throw new Error('owned_receipt_required');
const nonce = randomUUID();
const marker = `[bizq33-sdk-cache]:${nonce}`;
const pages = await (await fetch('http://[::1]:8081/json/list', {signal:AbortSignal.timeout(5000)})).json();
const matches = pages.filter(p=>p.appId==='com.lkurczab.patternly'&&p.deviceName==='iPhone 17');
if(matches.length!==1 || !matches[0].webSocketDebuggerUrl?.startsWith('ws://[::1]:8081/')) throw new Error('sole_existing_inspector_required');
const expression = `(() => { const marker=${JSON.stringify(marker)}, nonce=${JSON.stringify(nonce)}; (async()=>{
 let stage='initialized_filesystem', file=null, created=false, readEqual=false, cleanup=false;
 try {
  const modules=globalThis.__r?.getModules?.(); if(!modules) throw new Error();
  const entries=[...modules.values()].filter(m=>['node_modules/expo-file-system/src/index.ts','node_modules/expo-file-system/build/index.js'].some(suffix=>m.verboseName===suffix || m.verboseName?.endsWith('/'+suffix)));
  if(entries.length!==1 || entries[0].isInitialized!==true) throw new Error();
  const fs=entries[0].publicModule.exports;
  if(typeof fs.File!=='function' || !fs.Paths?.cache) throw new Error();
  stage='own_cache_file'; file=new fs.File(fs.Paths.cache,'bizq33-q13-capability-'+nonce+'.json');
  if(file.exists) {file=null;throw new Error();}
  stage='create';file.create({overwrite:false});created=true;
  stage='write';const body=JSON.stringify({schema:1,nonce,stage:'capability'});file.write(body);
  stage='read';readEqual=(await file.text())===body;if(!readEqual)throw new Error();
  stage='cleanup';file.delete();created=false;cleanup=!file.exists;if(!cleanup)throw new Error();
  console.log(marker,JSON.stringify({ok:true,stage:'complete',initializedFilesystem:true,readEqual,cleanup,canonicalStoreWrites:false}));
 } catch {
  if(created&&file){try{file.delete();cleanup=!file.exists;}catch{cleanup=false;}}
  console.log(marker,JSON.stringify({ok:false,stage,readEqual,cleanup,canonicalStoreWrites:false}));
 }
 })(); })()`;
const socket=new WebSocket(matches[0].webSocketDebuggerUrl, {origin:"http://127.0.0.1:8081"});
let done=false;
const timer=setTimeout(()=>finish({ok:false,stage:'inspector_timeout',cleanup:'unknown'}),15000);
function finish(value){if(done)return;done=true;clearTimeout(timer);socket.close();writeFileSync(output,JSON.stringify({...value,nonce,scope:'Debug SDK capability only; not Release/Q13 acceptance'},null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(value));if(!value.ok)process.exitCode=1;}
socket.on('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.enable'})));
socket.on('message',data=>{let event;try{event=JSON.parse(data.toString());}catch{return;}if(event.id===1){if(event.error)return finish({ok:false,stage:'inspector_enable'});socket.send(JSON.stringify({id:2,method:'Runtime.evaluate',params:{expression,awaitPromise:false,returnByValue:true}}));return;}if(event.method==='Runtime.consoleAPICalled'&&event.params?.args?.[0]?.value===marker){try{finish(JSON.parse(event.params.args[1].value));}catch{finish({ok:false,stage:'probe_message'});}}});
socket.on('error',()=>finish({ok:false,stage:'inspector_connection'}));
