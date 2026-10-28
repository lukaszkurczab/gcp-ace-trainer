/** Reject blank/unsettled loading PNGs; this is not a visual, safe-area or VoiceOver PASS. */
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{colors}=require('../../src/theme/tokens.ts');
const [imagePath,receiptPath,hierarchyPath]=process.argv.slice(2);if(!imagePath||!receiptPath||!hierarchyPath)throw Error('loading_paint_arguments');
const receipt=JSON.parse(readFileSync(receiptPath,'utf8')),hierarchy=JSON.parse(readFileSync(hierarchyPath,'utf8'));
const {locale,theme}=receipt.receipt.parameters,copy=JSON.parse(readFileSync(new URL(`../../src/locales/${locale}/common.json`,import.meta.url),'utf8'));
let frame;const visit=node=>{if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==='object'){const a=node.attributes;if(a?.['resource-id']==='account-profile-transition-loading'&&a.accessibilityText===copy['Preparing Patternly'])frame=a;Object.values(node).forEach(visit);}};visit(hierarchy);
if(!frame)throw Error('loading_paint_native_binding_missing');
const bytes=readFileSync(imagePath),{PNG}=require('pngjs'),png=PNG.sync.read(bytes),scale=receipt.window.scale;
if(png.width!==receipt.window.width*scale||png.height!==receipt.window.height*scale)throw Error('loading_paint_dimensions');
const bounds=frame.bounds.match(/-?\d+/g).map(Number);if(bounds.length!==4||bounds[0]<0||bounds[1]<0||bounds[2]>receipt.window.width||bounds[3]>receipt.window.height||bounds[2]<=bounds[0]||bounds[3]<=bounds[1])throw Error('loading_paint_native_bounds');
const foreground=colors[theme].processing.textPrimary,rgb=foreground.slice(1).match(/../g).map(value=>parseInt(value,16));let pixels=0;
for(let y=bounds[1]*scale;y<bounds[3]*scale;y++)for(let x=bounds[0]*scale;x<bounds[2]*scale;x++){const index=(y*png.width+x)*4;if(png.data[index]===rgb[0]&&png.data[index+1]===rgb[1]&&png.data[index+2]===rgb[2])pixels++;}
if(pixels<20)throw Error('loading_paint_blank_or_unsettled');
process.stdout.write(JSON.stringify({method:'exact static-title source-color pixels inside the matching native loading frame',scene:receipt.receipt.parameters.scene,locale,theme,foreground,foregroundPixels:pixels,imageSha256:createHash('sha256').update(bytes).digest('hex'),scope:'nonblank paint rejection only; manual visual/occlusion/AT review remains required'},null,2)+'\n');
