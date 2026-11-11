// Deterministic before/after-swap layout: Fraunces loaded vs Fraunces blocked with a Georgia-metric fallback.
// variant reg  = Georgia Regular x size-adjust (what Chrome/Edge/Firefox resolve local("Georgia") to, no synthesis)
// variant bold = Georgia Bold x size-adjust    (what WebKit's family lookup returns for a weight-600 request)
const { chromium } = require('playwright');
const fs = require('fs');
const PV = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/review/A/perf-verify';
const BASE = process.env.BASE || 'http://localhost:8720';
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const WIDTHS = (process.env.WIDTHS || '360,375,390,393,412,430,768,1280,1440').split(',').map(Number);
const FACE = process.env.FACE; // optional replacement for the whole fallback face block
const css0 = fs.readFileSync(process.env.CSSFILE || '/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
const PAGES2 = process.env.PAGES ? process.env.PAGES.split(',') : null;
function cssFor(variant) {
  const re = /@font-face \{ font-family: "Fraunces Fallback";[^}]*\}/;
  if (!re.test(css0)) throw new Error('fallback face not found');
  // live: the face as now written, Georgia Bold stood in by Gelasio at 700 (static, as the real file is)
  if (variant === 'live') return css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2");').replace('font-weight: 100 900;', 'font-weight: 700;'));
  if (variant === 'reg') return css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 400;'));
  if (variant === 'bold') return css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700;'));
  if (variant === 'fixreg') return css0.replace(re, '@font-face { font-family: "Fraunces Fallback"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 400; size-adjust: 109.6%; ascent-override: 89%; descent-override: 23%; }');
  if (variant === 'fixreg-onwebkit') return css0.replace(re, '@font-face { font-family: "Fraunces Fallback"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700; size-adjust: 109.6%; ascent-override: 89%; descent-override: 23%; }');
  if (variant === 'fixbold') return css0.replace(re, '@font-face { font-family: "Fraunces Fallback"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700; size-adjust: 94%; ascent-override: 103%; descent-override: 27%; }');
  throw new Error('variant?');
}
async function measure(browser, variant, blocked, w, p) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route('**/*', r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (u.includes('/__f/')) return r.fulfill({ body: fs.readFileSync(PV + '/fonts/' + u.split('/__f/')[1]), contentType: 'font/woff2' });
    if (u.endsWith('/assets/css/styles.css')) return r.fulfill({ body: cssFor(variant), contentType: 'text/css' });
    if (blocked && u.includes('fraunces')) return r.abort();
    r.continue();
  });
  await page.goto(BASE + p, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1'); const cs = getComputedStyle(h1);
    const r = h1.getBoundingClientRect();
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
    const rng = document.createRange(); rng.selectNodeContents(h1);
    const tops = new Set([...rng.getClientRects()].map(q => Math.round(q.top)));
    const main = document.querySelector('main');
    const blocks = [...document.querySelectorAll('main > *, main > * > .container > *')].map(e => Math.round(e.getBoundingClientRect().top + scrollY));
    // every heading: line count
    const heads = [...document.querySelectorAll('h1,h2,h3,.title')].filter(e => e.offsetParent && getComputedStyle(e).fontFamily.includes('Fraunces')).map(e => { const g = document.createRange(); g.selectNodeContents(e); return new Set([...g.getClientRects()].map(q => Math.round(q.top))).size; });
    return { fam: document.fonts.check('600 20px Fraunces'), h1h: Math.round(r.height), h1lines: tops.size, h1bottom: Math.round(r.bottom + scrollY), doc: document.documentElement.scrollHeight, blocks, heads };
  });
  await ctx.close();
  return m;
}
(async () => {
  const variant = process.argv[2] || 'reg';
  const browser = await chromium.launch();
  const rows = [];
  for (const p of (PAGES2 || PAGES)) for (const w of WIDTHS) {
    const a = await measure(browser, variant, true, w, p);   // before swap (fallback)
    const z = await measure(browser, variant, false, w, p);  // after swap (Fraunces)
    if (a.fam) console.log('WARN fraunces not blocked', p, w);
    if (!z.fam) console.log('WARN fraunces not loaded', p, w);
    const headsDiff = a.heads.filter((n, i) => n !== z.heads[i]).length;
    // first-screen movement: largest change in top of any block that starts inside the first viewport after swap
    const vh = w < 700 ? 844 : 800; let firstMove = 0;
    z.blocks.forEach((t, i) => { if (t < vh && a.blocks[i] !== undefined) firstMove = Math.abs(a.blocks[i] - t) > Math.abs(firstMove) ? a.blocks[i] - t : firstMove; });
    rows.push({ p, w, h1: a.h1lines + '>' + z.h1lines, h1h: a.h1h + '>' + z.h1h, firstMove: -firstMove, doc: z.doc - a.doc, headsDiff, nHeads: z.heads.length });
  }
  fs.writeFileSync(__dirname + '/swap-' + variant + '.json', JSON.stringify(rows, null, 1));
  const moved = rows.filter(r => r.h1.split('>')[0] !== r.h1.split('>')[1]);
  console.log('variant', variant, 'cases', rows.length, 'h1 line count changes', moved.length, 'first-screen moves >=8px', rows.filter(r => Math.abs(r.firstMove) >= 8).length, 'cases with any heading re-wrapping', rows.filter(r => r.headsDiff).length);
  for (const r of rows.filter(r => r.h1.split('>')[0] !== r.h1.split('>')[1] || Math.abs(r.firstMove) >= 8)) console.log(' ', r.p.padEnd(28), String(r.w).padEnd(5), 'h1 lines', r.h1, 'h1 height', r.h1h, 'first screen moves', r.firstMove + 'px', 'doc', r.doc, 'headings re-wrapped', r.headsDiff + '/' + r.nHeads);
  await browser.close();
})();
