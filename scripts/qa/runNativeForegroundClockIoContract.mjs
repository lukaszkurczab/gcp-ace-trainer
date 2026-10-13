import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,openSync,closeSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const DEVICE='7F315654-3175-4F3C-BB24-B0263F59360C';
function privatePath(path,directory) {
  if(!isAbsolute(path)||realpathSync(path)!==path)throw Error('private_path_rejected');
  const inside=relative(resolve(ROOT,'artifacts/private'),path),s=lstatSync(path);
  if(!inside||inside.startsWith('..')||isAbsolute(inside)||s.uid!==process.getuid()
    ||(directory?!s.isDirectory():!s.isFile()))throw Error('private_path_rejected');
}
function run(command,args,options={}) {
  const result=spawnSync(command,args,{cwd:ROOT,encoding:'utf8',timeout:60_000,maxBuffer:512*1024,...options});
  if(result.status!==0)throw Error('native_io_stage_failed');
  return result.stdout;
}
export function runNativeForegroundClockIoContract(buildRoot,responseFile,privateRoot) {
  privatePath(buildRoot,true);privatePath(responseFile,false);privatePath(privateRoot,true);
  if((lstatSync(privateRoot).mode&0o777)!==0o700||relative(buildRoot,responseFile).startsWith('..'))throw Error('private_path_rejected');
  const sdk=run('xcrun',['--sdk','iphonesimulator','--show-sdk-path']).trim();
  const product=resolve(buildRoot,'products/Debug-iphonesimulator');
  const sources=['scripts/qa/nativeForegroundClockIoContract.mm','native/foreground-clock/PatternlyForegroundClock.mm',
    'native/foreground-clock/ForegroundTimerRecord.mm','native/foreground-clock/ForegroundTimerRecord.hpp','native/foreground-clock/ForegroundClockSegment.hpp',
    'node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp'];
  const hashes=Object.fromEntries(sources.map(source=>[source,createHash('sha256').update(readFileSync(resolve(ROOT,source))).digest('hex')]));
  const binary=resolve(privateRoot,'native-owner-io-contract');
  // Reserve every output before compilation. No existing evidence is replaced.
  const receipt=resolve(privateRoot,'receipt.json');const receiptFd=openSync(receipt,'wx',0o600);
  let logFd;
  try {
    logFd=openSync(resolve(privateRoot,'compile.log'),'wx',0o600);
    const reservation=openSync(binary,'wx',0o700);closeSync(reservation);
    const args=['--sdk','iphonesimulator','clang++','@'+responseFile,'-target','arm64-apple-ios26.4-simulator','-isysroot',sdk,
      resolve(ROOT,sources[0]),resolve(ROOT,sources[2]),'-framework','Foundation','-framework','UIKit'];
    for(const library of ['NitroModules','NitroMmkv','React-jsi'])args.push('-L'+resolve(product,library),'-l'+library);
    // Pinned JSI implementation supplies types used by Nitro, with no dynamic
    // Hermes framework and no creation of a JavaScript runtime.
    args.push('-x','objective-c++',resolve(ROOT,sources.at(-1)),'-o',binary);
    run('xcrun',args,{stdio:['ignore',logFd,logFd]});
    run('codesign',['--force','--sign','-',binary]);
    run('codesign',['--verify','--strict',binary]);
    const stdout=run('xcrun',['simctl','spawn',DEVICE,binary],{timeout:15_000});
    const value=JSON.parse(stdout);
    if(Object.keys(value).sort().join(',')!=='cases,stage'||value.stage!=='native_owner_io_contract_passed'||value.cases!==5)throw Error('native_io_receipt_rejected');
    for(const [source,hash]of Object.entries(hashes))if(createHash('sha256').update(readFileSync(resolve(ROOT,source))).digest('hex')!==hash)throw Error('source_changed_during_run');
    writeFileSync(receiptFd,JSON.stringify({stage:value.stage,cases:value.cases,sourceHashes:hashes,responseSha256:createHash('sha256').update(readFileSync(responseFile)).digest('hex'),
      command:['xcrun',...args],binarySha256:createHash('sha256').update(readFileSync(binary)).digest('hex'),device:DEVICE},null,2)+'\n');
    return value;
  } finally {if(logFd!==undefined)closeSync(logFd);closeSync(receiptFd);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [buildRoot,responseFile,privateRoot,...extra]=process.argv.slice(2);
  try {if(!privateRoot||extra.length)throw Error('arguments_rejected');console.log(JSON.stringify(runNativeForegroundClockIoContract(buildRoot,responseFile,privateRoot)));}
  catch {console.error(JSON.stringify({stage:'failed',category:'native_io_compile_or_run_failed'}));process.exitCode=1;}
}
