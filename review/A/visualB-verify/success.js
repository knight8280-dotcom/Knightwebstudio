// Checkout success: stub the status endpoint only (inline script untouched), read the h1 line boxes per width.
// node success.js <state: paid|ach|failed|care> [extraCSS file] [shotWidthsCsv]
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.env.BASE || 'http://localhost:8720';
const [state = 'paid', cssFile = '', shots = ''] = process.argv.slice(2);
const BODY = {
  paid: { status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' },
  care: { status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 30000, currency: 'usd', plan: 'essential-care' },
  ach: { status: 'complete', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' },
  failed: { status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' },
}[state];
const linesFn = (sel) => {
  const el = document.querySelector(sel);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const chars = []; let n;
  while ((n = walker.nextNode())) {
    const t = n.nodeValue;
    for (let i = 0; i < t.length; i++) {
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
      const rc = r.getClientRects()[0]; if (!rc) continue;
      if (rc.width === 0 && /\s/.test(t[i])) continue;
      chars.push({ c: t[i], top: Math.round(rc.top + rc.height / 2), left: rc.left, right: rc.right });
    }
  }
  const lines = [];
  for (const ch of chars) {
    let L = lines.find(l => Math.abs(l.top - ch.top) < 6);
    if (!L) { L = { top: ch.top, s: '', left: ch.left, right: ch.right }; lines.push(L); }
    L.s += ch.c; L.left = Math.min(L.left, ch.left); L.right = Math.max(L.right, ch.right);
  }
  const cs = getComputedStyle(el);
  return { lines: lines.map(l => l.s.trim()), widths: lines.map(l => Math.round(l.right - l.left)), fs: cs.fontSize, w: Math.round(el.getBoundingClientRect().width), tw: cs.textWrap || cs.textWrapMode, overflow: document.documentElement.scrollWidth - innerWidth };
};
(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, deviceScaleFactor: 2 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com/, r => r.abort());
    await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(BODY) }));
    const page = await ctx.newPage();
    await page.goto(`${base}/checkout/success/?plan=${BODY.plan}&session_id=cs_test_abcdefghij1234567890`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    if (cssFile) await page.addStyleTag({ content: fs.readFileSync(cssFile, 'utf8') });
    console.log('title:', await page.textContent('#success-title'));
    let prev = null, start = null, last = null;
    for (let w = 320; w <= 1920; w += 10) {
      await page.setViewportSize({ width: w, height: 844 });
      await page.waitForTimeout(40);
      const r = await page.evaluate(`(${linesFn.toString()})('#success-title')`);
      const key = r.lines.join(' / ');
      if (key !== prev) { if (prev !== null) console.log(`${start}..${last}: ${prev}`); prev = key; start = w; console.log(`   @${w} fs=${r.fs} boxw=${r.w} linew=${r.widths.join(',')} tw=${r.tw} overflowX=${r.overflow}`); }
      last = w;
    }
    console.log(`${start}..${last}: ${prev}`);
    for (const w of shots.split(',').filter(Boolean)) {
      await page.setViewportSize({ width: +w, height: 844 });
      await page.waitForTimeout(200);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `success-${state}-${w}${cssFile ? '-fix' : ''}.png` });
    }
    await ctx.close();
  }
  await browser.close();
})();
