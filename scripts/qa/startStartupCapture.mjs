/** Existing smoke profile, unchanged native install; never synchronizes bundled content. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { parseDotenv, validateLocalProfile } from '../runLocalProfile.mjs';
const [mode, receiptPath]=process.argv.slice(2);
if(!['preview','regular'].includes(mode)||!receiptPath||!resolve(receiptPath).startsWith(resolve('.agent/private')+'/'))throw Error('capture_launcher_arguments');
const env={...validateLocalProfile('smoke',{...process.env,...parseDotenv(readFileSync('.env.smoke.local','utf8'))})};
for(const key of Object.keys(env))if(/PERSIST13|PERF06/.test(key)&&env[key])throw Error('capture_launcher_fixture_conflict');
if(mode==='preview')env.EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW='1';else delete env.EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW;
const child=spawn('/opt/homebrew/opt/node@22/bin/node',['node_modules/expo/bin/cli','start','--dev-client','--port','8083'],{env:{...env,CI:'1'},stdio:'inherit'});
writeFileSync(receiptPath,JSON.stringify({launcherPid:process.pid,metroPid:child.pid,mode,port:8083,contentSync:false},null,2)+'\n');
process.on('SIGTERM',()=>child.kill('SIGTERM'));process.on('SIGINT',()=>child.kill('SIGINT'));child.on('exit',code=>process.exit(code??1));
