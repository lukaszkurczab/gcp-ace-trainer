import test from 'node:test';
import assert from 'node:assert/strict';
import {validateListMeasurement} from './measureNativeListPresentation.mjs';
const configuration={screen:'activity',size:50};
const valid={schema:'patternly.perf06.list-measurement.v1',configuration,startedAt:1,stoppedAt:5001,mountedRows:10,peakMountedRows:20,rowMounts:30,rowUnmounts:20,commits:4,renderDurationMs:25,longTasks:[60],frameGaps:[16,17],truncated:false,frameSource:'JS requestAnimationFrame callbacks; not native frame presentation'};
test('list readback accepts bounded synthetic metrics and rejects payloads or changed scenario',()=>{
 assert.equal(validateListMeasurement(valid,configuration),valid);
 for(const value of [{...valid,profile:'private'},{...valid,configuration:{...configuration,profile:'private'}},{...valid,configuration:{screen:'activity',size:500}},{...valid,frameSource:'native'}]) assert.throws(()=>validateListMeasurement(value,configuration),/measurement_rejected/);
});
test('list readback rejects incomplete, inconsistent, nonfinite and truncated measurements',()=>{
 for(const change of [{mountedRows:0},{rowUnmounts:21},{peakMountedRows:9},{commits:0},{rowMounts:2.5},{startedAt:NaN},{stoppedAt:0},{renderDurationMs:Infinity},{longTasks:[-1]},{longTasks:Array(513).fill(1)},{frameGaps:[]},{frameGaps:Array(2401).fill(16)},{frameGaps:[NaN]},{truncated:true}]) assert.throws(()=>validateListMeasurement({...valid,...change},configuration),/measurement_rejected/);
});
