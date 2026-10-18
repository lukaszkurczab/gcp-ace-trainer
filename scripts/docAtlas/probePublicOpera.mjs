import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('../../../', import.meta.url));
const privateRoot = resolve(workspace, 'patternly/.agent/private');
const output = resolve(process.argv[2] ?? resolve(privateRoot, 'atlas-opera-live'));
const within = relative(privateRoot, output);
if (!within || within.startsWith('..') || within.startsWith('/')) throw new Error('atlas/private-output-required');
mkdirSync(output, { recursive: true, mode: 0o700 });
const { chromium } = createRequire(resolve(workspace, 'patternly-web/package.json'))('playwright');
const browser = await chromium.launch({ executablePath: '/Applications/Opera.app/Contents/MacOS/Opera', headless: true });
const receipt = { browserExecutable: '/Applications/Opera.app/Contents/MacOS/Opera', engineVersion: browser.version(), results: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [index, url] of ['https://patternly.it', 'http://patternly.it'].entries()) {
    try {
      const response = await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      receipt.results.push({ url, status: response?.status(), title: await page.title(), finalUrl: page.url(), checkedAt: new Date().toISOString() });
      await page.screenshot({ path: resolve(output, `${index}-public.png`), fullPage: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      receipt.results.push({ url, stage: 'navigation', category: /CERT_/u.test(message) ? 'certificate' : /Timeout/u.test(message) ? 'timeout' : 'network-or-browser', checkedAt: new Date().toISOString() });
    }
  }
} finally { await browser.close(); }
writeFileSync(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify(receipt, null, 2));
