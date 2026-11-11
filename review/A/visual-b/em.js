const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe/, r => r.abort());
  await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd' }) }));
  const page = await ctx.newPage(); await page.goto('http://localhost:8720/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(800);
  const r = await page.evaluate(() => { const h = document.querySelector('h1'); const cs = getComputedStyle(h); const c = h.cloneNode(false); c.removeAttribute('id'); c.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden;max-width:none;width:max-content'; h.parentElement.appendChild(c); const fs = parseFloat(cs.fontSize); const m = t => { c.textContent = t; return Math.round(c.getBoundingClientRect().width * 10) / 10; }; const out = { fontSize: fs, container: h.getBoundingClientRect().width, a: m('Payment confirmed —'), b: m('Payment confirmed'), all: m('Payment confirmed — thank you') }; c.remove(); return out; });
  console.log(JSON.stringify(r), 'em for "Payment confirmed —":', (r.a / r.fontSize).toFixed(3));
  // what font-size factor makes line 1 hold the dash at each width? test by overriding font-size
  for (const w of [340, 360, 375, 390, 414, 430, 480, 540, 599]) {
    await page.setViewportSize({ width: w, height: 844 });
    const res = await page.evaluate(() => { const h = document.querySelector('h1'); const base = parseFloat(getComputedStyle(h).fontSize); const lines = () => { const range = document.createRange(); const n = h.firstChild; const out = []; const re = /\S+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const r = range.getClientRects()[0]; let L = out.find(l => Math.abs(l.top - r.top) < 6); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0]); } return out.map(l => l.w.join(' ')).join(' / '); }; const tries = []; for (const f of [1, .95, .9, .88, .85, .8]) { h.style.fontSize = (base * f) + 'px'; h.style.textWrap = 'pretty'; tries.push(f + ':' + (base * f).toFixed(1) + 'px => ' + lines()); } h.style.fontSize = ''; h.style.textWrap = ''; return tries; });
    console.log(w, res.join(' | '));
  }
  await browser.close();
})();
