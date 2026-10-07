#!/usr/bin/env node
// Restore only the already-provisioned local fixture identity. No SDK app transition/backend registration.
import { createRequire } from 'node:module';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const requireBackend = createRequire(new URL('../../../../../patternly-backend/package.json', import.meta.url));
const {initializeApp,deleteApp}=requireBackend('firebase-admin/app');
const {getAuth}=requireBackend('firebase-admin/auth');
const output=new URL('./AUTH-FIXTURE-RESTORE-2026-10-07.json',import.meta.url);
let stage='loopback_guard',app;
try {
 if(process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:19099'||process.env.FIREBASE_PROJECT_ID!=='patternly-app-sandbox')throw new Error();
 stage='fixture_guard';
 const fixturePath='/private/tmp/bizq33-account.json',stat=statSync(fixturePath);
 if(!stat.isFile()||(stat.mode&0o777)!==0o600)throw new Error();
 const {uid,email,password}=JSON.parse(readFileSync(fixturePath,'utf8'));
 const provision=JSON.parse(readFileSync(new URL('./ACCOUNT-PROVISION-RESULT.json',import.meta.url),'utf8'));
 const uidSha256=createHash('sha256').update(uid).digest('hex');
 if(!provision.ok||uidSha256!==provision.uidSha256||typeof email!=='string'||!email.endsWith('@patternly.test')||typeof password!=='string'||password.length<24)throw new Error();
 stage='local_readiness';
 const ready=await fetch('http://127.0.0.1:19099/emulator/v1/projects/patternly-app-sandbox/config');
 if(!ready.ok)throw new Error();
 app=initializeApp({projectId:'patternly-app-sandbox'},'bizq33-owned-auth-restore');
 const auth=getAuth(app);let user,created=false;
 stage='get_exact_owned_uid';
 try {user=await auth.getUser(uid);} catch(e) {
  if(e?.code!=='auth/user-not-found')throw new Error();
  stage='create_exact_owned_uid';
  // An uncertain create stops; never retry or generate another identity.
  user=await auth.createUser({uid,email,password});created=true;
 }
 stage='verify_exact_owned_uid';
 if(user.uid!==uid||user.email!==email||user.disabled)throw new Error();
 const result={ok:true,project:'patternly-app-sandbox',emulator:'127.0.0.1:19099',uidSha256,created,existingIdentityRestored:true,newUidGenerated:false,backendRegistration:false,SDKTransition:false,GuestWrites:false};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
} catch {
 console.error(JSON.stringify({ok:false,stage,stopNoRetry:true}));process.exitCode=1;
} finally {if(app)await deleteApp(app);}
