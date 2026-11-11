// Keyboard walk at 390x844: when a whole-card link takes focus, how much of the card (and its ring) is on screen, clear of the sticky header and the sticky phone bar?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await c.newPage(); await p.goto('http://localhost:8730/kit/light/demo.html'); await p.waitForTimeout(1500);
  await p.focus('.price-strip'); const out = [];
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const a = document.activeElement, card = a.closest('.kws-link'); if (!card) return null; const q = card.getBoundingClientRect(); const head = document.querySelector('.site-header').getBoundingClientRect().bottom, bar = document.querySelector('#mobile-cta, .mobile-cta'); const barTop = bar && getComputedStyle(bar).visibility !== 'hidden' ? bar.getBoundingClientRect().top : innerHeight; const top = Math.max(q.top - 6, head), bot = Math.min(q.bottom + 6, barTop); return { name: a.textContent.trim().slice(0, 22), cardH: Math.round(q.height), visible: Math.round(100 * Math.max(0, bot - top) / (q.height + 12)), cutTop: Math.round(Math.max(0, head - (q.top - 6))), cutBottom: Math.round(Math.max(0, q.bottom + 6 - barTop)), free: Math.round(barTop - head) }; });
    if (r) out.push(r);
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
