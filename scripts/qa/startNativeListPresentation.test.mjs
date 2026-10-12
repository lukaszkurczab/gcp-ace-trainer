import test from 'node:test';
import assert from 'node:assert/strict';
import {listMeasurementEnvironment} from './startNativeListPresentation.mjs';
import {readFileSync} from 'node:fs';
import {parseDotenv} from '../runLocalProfile.mjs';
// Public template values, no local credentials.
const profile={...parseDotenv(readFileSync('.env.smoke.example','utf8')),
 EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY:'local-api-key', EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID:'1:123:ios:local',
 EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN:'patternly-app-sandbox.firebaseapp.com', EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID:'patternly-app-sandbox',
 EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID:'local-android-client', EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID:'local-ios-client', EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID:'local-web-client'};
test('isolated list launch validates smoke and removes inherited fixture/runtime overrides',()=>{
 const env=listMeasurementEnvironment({PATH:'/public/node',PATTERNLY_RUNTIME_MODE:'sandbox',EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE:'reset',EXPO_PUBLIC_PATTERNLY_API_ORIGIN:'https://wrong.test'},profile);
 assert.equal(env.PATTERNLY_RUNTIME_MODE,'smoke'); assert.equal(env.EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE,'lists'); assert.equal(env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,undefined); assert.equal(env.CI,'1'); assert.equal(env.PATH,'/public/node');
});
test('isolated list launch rejects conflicting fixture or invalid profile',()=>{
 for(const key of ['EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE','EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID','EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO']) for(const value of ['reset','']) assert.throws(()=>listMeasurementEnvironment({}, {...profile,[key]:value}),/fixture_conflict/);
 assert.throws(()=>listMeasurementEnvironment({}, {...profile,PATTERNLY_RUNTIME_MODE:'sandbox'}));
});
