import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {renderPreparedFlow} from './runCh07PreparedSignIn.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const c={schemaVersion:1,uid:'fixture-uid',email:'fixture@example.invalid',password:'fixture: "quoted"\n---\n- launchApp'};
const m={schemaVersion:1,projectId:'patternly-app-sandbox',stage:'registered',uidSha256:sha(c.uid),emailSha256:sha(c.email),credentialSha256:sha(JSON.stringify(c)+'\n')};
const template=readFileSync(new URL('../../.maestro/ch07-account-sign-in.yaml',import.meta.url),'utf8');
test('credential strings remain quoted YAML scalars, not commands',()=>{
 const result=renderPreparedFlow(c,m,template);
 assert.ok(result.includes('CH07_PASSWORD: '+JSON.stringify(c.password)));
 assert.equal(result.split('\n---\n').length,2);
 assert.ok(result.endsWith(template.split('---\n')[1]));
});
test('rejects altered actor and unregistered or foreign project manifests',()=>{
 for(const patch of[{stage:'auth_created'},{projectId:'production'},{uidSha256:'bad'},{emailSha256:'bad'},{credentialSha256:'bad'}])assert.throws(()=>renderPreparedFlow(c,{...m,...patch},template),/prepared_actor_rejected/);
 assert.throws(()=>renderPreparedFlow({...c,password:'changed'},m,template),/prepared_actor_rejected/);
});
