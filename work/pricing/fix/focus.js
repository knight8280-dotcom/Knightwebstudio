// Is each focused link in main clear of the sticky header (and the phone bar)? node focus.js WIDTH
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const w = parseInt(process.argv[2] || '1440', 10);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: w < 700 ? 664 : 900 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const m = document.querySelector('main'); m.tabIndex = -1; m.focus({ preventScroll: true }); });
  let out = [];
  for (let i = 0; i < 27; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(120);
    out.push(await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); const bar = document.querySelector('.mobile-cta'); const br = bar && getComputedStyle(bar).visibility !== 'hidden' && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight; const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { t: e.textContent.trim().slice(0, 22), top: Math.round(r.top), bottom: Math.round(r.bottom), headerBottom: Math.round(h.bottom), barTop: Math.round(br), hit: !!(el && (el === e || e.contains(el))) }; }));
  }
  const bad = out.filter(o => !o.hit || o.top < o.headerBottom || o.bottom > o.barTop);
  console.log(w, 'stops', out.length, '| covered or not hit-testable at its centre:', bad.length ? JSON.stringify(bad) : 'none');
  await b.close();
})();
