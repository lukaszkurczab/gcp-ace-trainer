// Captures only the bounded development probe; no Runtime.evaluate or app-state reads.
import WebSocket from 'ws';
import { appendFileSync } from 'node:fs';
const pages=await(await fetch('http://[::1]:8081/json/list')).json();
const page=pages.find(p=>p.appId==='com.lkurczab.patternly'&&p.deviceName==='iPhone 17');
if(!page)throw Error('Target iPhone 17 debugger unavailable');
const out=process.argv[2];if(!out)throw Error('Output required');
const socket=new WebSocket(page.webSocketDebuggerUrl,{origin:'http://127.0.0.1:8081'});
socket.on('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.enable'})));
socket.on('message',data=>{
 const event=JSON.parse(data);
 if(event.id===1){console.log(JSON.stringify({runtimeEnable:!event.error}));return;}
 if(event.method!=='Runtime.consoleAPICalled')return;
 const args=event.params.args;
 if(args?.[0]?.value!=='[native28-layout-probe]')return;
 const payload=JSON.parse(args[1].value);appendFileSync(out,JSON.stringify(payload)+'\n');
 console.log(payload.surface);
});
socket.on('error',()=>{console.error('debugger_connection_failed');process.exitCode=1;});
setTimeout(()=>socket.close(),240000);
