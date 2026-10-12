import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {parseDotenv,validateLocalProfile} from '../runLocalProfile.mjs';

export function listMeasurementEnvironment(inherited, profile) {
  const base=Object.fromEntries(Object.entries(inherited).filter(([key])=>!key.startsWith('PATTERNLY_')&&!key.startsWith('EXPO_PUBLIC_PATTERNLY_')));
  if (['EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE','EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID','EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO'].some(key=>profile[key]!==undefined)) throw Error('fixture_conflict');
  return validateLocalProfile('smoke',{...base,...profile,CI:'1',EXPO_OFFLINE:'1',EXPO_NO_DOTENV:'1',EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE:'lists'});
}

// A separate JS entry loads no account/storage providers. No API/emulator preflight,
// native build, installation, app launch, reset or secret output is performed here.
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length!==2) throw Error('arguments_rejected');
    const root=fileURLToPath(new URL('../../',import.meta.url));
    const env=listMeasurementEnvironment(process.env,parseDotenv(readFileSync(new URL('../../.env.smoke.local',import.meta.url),'utf8')));
    const child=spawn(process.execPath,[fileURLToPath(new URL('../../node_modules/expo/bin/cli',import.meta.url)),'start','--localhost','--port','8082'],{cwd:root,env,stdio:'inherit'});
    child.once('error',()=>{console.error('list_measurement_server_failed');process.exitCode=1;});
    child.once('exit',code=>{process.exitCode=code??1;});
  } catch {
    console.error('list_measurement_configuration_rejected');process.exitCode=1;
  }
}
