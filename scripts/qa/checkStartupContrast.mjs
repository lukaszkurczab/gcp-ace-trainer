/** Reproduce current F01 token contrast; optional PNG/native hierarchy verifies the rendered pair. */
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{colors}=require('../../src/theme/tokens.ts');
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const rows=Object.entries(colors).flatMap(([mode,c])=>[['F01 unavailable description',c.textSecondary,c.background],['recovery body',c.textSecondary,c.background],['Home decision detail',c.textSecondary,c.surface],['primary button',c.onPrimary,c.primary],['destructive button',c.onDanger,c.danger]].map(([role,foreground,background])=>({mode,role,foreground,background,ratio:ratio(foreground,background),minimum:4.5})));
if(rows.some(row=>row.ratio<row.minimum))throw Error('startup_token_contrast_failed');
const args=process.argv.slice(2);let rendered=null;
if(args.length){
 if(args.length!==6||args[0]!=='--image'||args[2]!=='--receipt'||args[4]!=='--hierarchy')throw Error('startup_pixel_arguments');
 const imageBytes=readFileSync(args[1]),receipt=JSON.parse(readFileSync(args[3],'utf8')),hierarchy=JSON.parse(readFileSync(args[5],'utf8'));
 const {locale,theme}=receipt.receipt.parameters;if(receipt.osAppearance!==theme)throw Error('startup_pixel_theme_binding');
 const dictionary=JSON.parse(readFileSync(new URL(`../../src/locales/${locale}/common.json`,import.meta.url),'utf8'));
 const expected=dictionary['Local profile storage could not be prepared.'];let attributes;
 const visit=value=>{if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object'){if(value.attributes?.accessibilityText===expected)attributes=value.attributes;Object.values(value).forEach(visit);}};visit(hierarchy);
 if(!attributes)throw Error('startup_pixel_native_description_missing');
 const {PNG}=require('pngjs'),png=PNG.sync.read(imageBytes),scale=receipt.window.scale;
 if(png.width!==receipt.window.width*scale||png.height!==receipt.window.height*scale)throw Error('startup_pixel_dimensions');
 const [left,top,right,bottom]=attributes.bounds.match(/\d+/g).map(x=>Number(x)*scale),fg=colors[theme].textSecondary,bg=colors[theme].background;
 const rgb=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));const foreground=rgb(fg),background=rgb(bg);let fgPixels=0,bgPixels=0;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const index=(y*png.width+x)*4;if(foreground.every((v,c)=>png.data[index+c]===v))fgPixels++;if(background.every((v,c)=>png.data[index+c]===v))bgPixels++;}
 if(!fgPixels||!bgPixels)throw Error('startup_pixel_source_color_mismatch');
 rendered={locale,theme,bounds:attributes.bounds,foreground:fg,background:bg,fgPixels,bgPixels,ratio:ratio(fg,bg),imageSha256:createHash('sha256').update(imageBytes).digest('hex')};
}
process.stdout.write(JSON.stringify({method:'relative luminance from exact source tokens; optional exact solid pixels in native text bounds',source:'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',rows,rendered},null,2)+'\n');
