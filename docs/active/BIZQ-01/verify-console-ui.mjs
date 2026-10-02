// Bounded browser evidence for the existing console; no outcome writes.
// node verify-console-ui.mjs /absolute/playwright/index.mjs http://127.0.0.1:<port>/
import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
const [modulePath,origin] = process.argv.slice(2);
const url = new URL(origin);
if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('Loopback console required');
const { chromium } = await import(pathToFileURL(modulePath).href);
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage({viewport:{width:1280,height:1000}});
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
 await page.goto(origin);
 await page.waitForFunction(() => document.getElementById('count').textContent === '16077 items');
 await page.locator('#track').selectOption('backend-system-design-interview');
 await page.locator('#unit').fill('BESD-N04-B01');
 await page.locator('#risk').check();
 await page.locator('#filters button').click();
 await page.waitForFunction(() => document.getElementById('count').textContent === '18 items');
 await page.locator('button.item').filter({has:page.locator('strong',{hasText:/^besd-n04-b01-i002$/})}).click();
 await page.locator('#detail h2').filter({hasText:'besd-n04-b01-i002'}).waitFor();
 const constraints = page.locator('#detail .field').filter({has:page.locator('label',{hasText:/^Constraints$/})});
 if (!(await constraints.locator('pre').innerText()).includes('The primary decision is')) throw new Error('Source constraints missing in DOM');
 const risks = page.locator('#detail .field').filter({has:page.locator('label',{hasText:/^Advisory risks$/})});
 if (!(await risks.innerText()).includes('author_instruction_in_constraints')) throw new Error('Warning missing in DOM');
 if (errors.length) throw new Error('Page script error');
 await page.screenshot({path:fileURLToPath(new URL('./CONSOLE.png',import.meta.url)),fullPage:false});
 const result = {sourceConstraintsVisible:true,riskVisible:true,pageErrors:errors,itemId:'besd-n04-b01-i002',viewport:{width:1280,height:1000},mobileTest:false};
 await writeFile(new URL('./UI-EVIDENCE.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
} finally { await browser.close(); }
