// At 390: tab to given link texts and snapshot; report whether the focused element's box is under the phone bar
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const want = ['ONE-PAGE', 'Full pricing', 'More about', '(225)', 'Book a discovery', 'Send an enquiry', 'Smilys', 'All services'];
  for (let i = 0; i < 60; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(350);
    const info = await p.evaluate(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); const bar = document.querySelector('.mobile-cta'); const br = bar.getBoundingClientRect(); return { t: (el.innerText || '').trim().slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), barTop: Math.round(br.top), show: bar.classList.contains('show'), inBar: bar.contains(el) }; });
    const w = want.find(x => info.t.startsWith(x));
    if (w && !info.inBar) { console.log(JSON.stringify(info), info.bottom > info.barTop && info.show ? 'UNDER BAR by ' + (info.bottom - info.barTop) : 'clear'); await p.screenshot({ path: `r4/focus-${w.replace(/\W+/g, '')}.png` }); }
    if (info.t.startsWith('Back to top')) break;
  }
  await b.close();
})();
