import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {buildMonitorExpression} from './readNavigationContinuityIos.mjs';
function runtime(){
  const hidden={memoizedProps:{navigation:{isFocused:()=>false},testID:'account-session-restore-loading'},type:{name:'AccountEntryScreen'},sibling:null};
  const root={current:{memoizedProps:{testID:'home-overview'},type:{name:'HomeScreen'},child:null,sibling:hidden}};
  let forwarded=0;const hook={renderers:new Map([[1,{}]]),getFiberRoots:()=>new Set([root]),onCommitFiberRoot(){forwarded++;return 'original-result';}};
  const context={HermesInternal:{},__DEV__:true,__REACT_DEVTOOLS_GLOBAL_HOOK__:hook,__r:Object.assign(()=>({readEnvironmentIdentity:()=>({mode:'smoke',apiOrigin:'http://127.0.0.1:8080'})}),{getModules:()=>new Map([[1,{isInitialized:true,verboseName:'src/infrastructure/runtime/environmentIdentity.ts'}]])}),performance:{now:()=>10}};
  context.globalThis=context;return {context:vm.createContext(context),root,hook,forwarded:()=>forwarded};
}
test('observer filters unfocused route, forwards original commit and removes itself',()=>{
  const r=runtime(),original=r.hook.onCommitFiberRoot;
  assert.equal(JSON.parse(vm.runInContext(buildMonitorExpression('start'),r.context)).started,true);
  r.root.current={memoizedProps:{testID:'practice-hub-loading-skeleton'},type:{name:'PracticeHubScreen'}};
  assert.equal(r.hook.onCommitFiberRoot(1,r.root),'original-result');
  const result=JSON.parse(vm.runInContext(buildMonitorExpression('stop'),r.context));
  assert.equal(result.commits,2);assert.equal(r.forwarded(),1);assert.equal(r.hook.onCommitFiberRoot,original);
  assert.deepEqual(result.events.map(x=>x.ids),[['home-overview'],['practice-hub-loading-skeleton']]);
  assert.equal(result.observationFailed,false);
});
test('observer rejects production and repeat attachment',()=>{
  const r=runtime();r.context.__DEV__=false;
  assert.throws(()=>vm.runInContext(buildMonitorExpression('start'),r.context),/runtime_rejected/);
  r.context.__DEV__=true;vm.runInContext(buildMonitorExpression('start'),r.context);
  assert.throws(()=>vm.runInContext(buildMonitorExpression('start'),r.context),/already_running/);
  vm.runInContext(buildMonitorExpression('stop'),r.context);
});
test('observer rejects unknown action before building expression',()=>assert.throws(()=>buildMonitorExpression('reset'),/action_rejected/));
