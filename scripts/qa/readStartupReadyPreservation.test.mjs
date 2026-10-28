import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReadyRestorationBaseline } from './readStartupReadyPreservation.mjs';
const settingsKey='patternly:canonical:v1:settings';
const baseline=()=>({kind:'startup-ready-preservation.v1',settings:null,profileHash:'same-owner',activeProfileIdHash:'active',recordHashes:{progress:'stable',unknown:'also-stable'},inventory:{kind:'observed',complete:true,physicalKeyCount:2,physicalInventorySha256:'before',registryGeneration:1,globalInventories:[{category:'metadata',inventorySha256:'global'}],profileInventories:[{profileIdSha256:'active',kind:'account',keyCount:2,inventorySha256:'before',categoryInventories:[{category:'learningProgress',inventorySha256:'facts'},{category:'settings',inventorySha256:'absent'}]},{profileIdSha256:'foreign',kind:'guest',keyCount:1,inventorySha256:'untouched',categoryInventories:[{category:'learningProgress',inventorySha256:'foreign-facts'}]}]}});
test('restoration guard allows only active settings delta; all unknown non-settings keys stay protected',()=>{
 const before=baseline(),current=structuredClone(before);current.settings={language:'de',appearance:'system'};current.recordHashes[settingsKey]='new-setting';current.inventory.physicalKeyCount++;current.inventory.physicalInventorySha256='changed';current.inventory.profileInventories[0].inventorySha256='changed';current.inventory.profileInventories[0].keyCount++;current.inventory.profileInventories[0].categoryInventories[1].inventorySha256='changed';
 assert.doesNotThrow(()=>assertReadyRestorationBaseline(before,current));
 for(const mutate of [x=>{x.profileHash='other-owner';},x=>{x.recordHashes.unknown='changed';},x=>{x.inventory.profileInventories[1].inventorySha256='changed';},x=>{x.inventory.profileInventories[0].categoryInventories[0].inventorySha256='changed';},x=>{x.inventory.globalInventories[0].inventorySha256='changed';},x=>{x.inventory.complete=false;}]){const broken=structuredClone(current);mutate(broken);assert.throws(()=>assertReadyRestorationBaseline(before,broken));}
});
test('original settings must be absent, not merely unreadable or replaced',()=>{
 const before=baseline();before.recordHashes[settingsKey]='unreadable-record';assert.throws(()=>assertReadyRestorationBaseline(before,baseline()),/original_settings_not_absent/);
 const stored=baseline();stored.settings={language:'en',appearance:'system'};assert.throws(()=>assertReadyRestorationBaseline(stored,baseline()),/original_settings_not_absent/);
});
