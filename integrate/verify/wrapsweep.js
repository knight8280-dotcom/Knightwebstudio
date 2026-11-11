// Wrap sweep: at every 20px from 320 to 1920, which short labels are taller (wrapped) in one copy and not the other?
const { chromium } = require('playwright');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const SEL = '.btn, .tag, .pill, .flag, .popular, .eyebrow, .label, .nav-links a, .tier-name, .tier-amt, .pl-name, .pl-price, .toc-name, .toc-price, h1, h2, h3, h4, .steps-no, .brand-name, .footer-col a, .price-strip-nums, .header-inner, .topbar-inner, .mobile-cta-inner, .payplan-seg, .spec-name, .spec-price, .board-extras dd, .appt-title, .receipt-total b, summary, .more-link, .menu-name, .menu-price, .stamp, .points li, .print-name, .case-facts a, .bizcard-lines a, .talk-tel';
const collect = sel => {
  const out = {};
  const seen = {};
  for (const e of document.querySelectorAll(sel)) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden') continue;
    const base = e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '').replace(/\b(visible|reveal|seq)\b/g, '').trim().split(/\s+/).sort().join('.') + '|' + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    seen[base] = (seen[base] || 0) + 1;
    out[base + '#' + seen[base]] = [Math.round(r.height), Math.round(r.right), parseFloat(cs.lineHeight) || 20];
  }
  return { els: out, W: innerWidth, SW: document.documentElement.scrollWidth };
};
(async () => {
  const b = await chromium.launch();
  const res = {};
  for (const p of PAGES) {
    const data = {};
    for (const [n, base] of [['a', 'http://localhost:8722'], ['b', 'http://localhost:8720']]) {
      const ctx = await b.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      data[n] = {};
      for (let w = 320; w <= 1920; w += 20) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(70);
        data[n][w] = await page.evaluate(collect, SEL);
      }
      await ctx.close();
    }
    const taller = {}, shorter = {};
    for (let w = 320; w <= 1920; w += 20) {
      const A = data.a[w].els, B = data.b[w].els;
      for (const k of Object.keys(B)) {
        if (!A[k]) continue;
        const d = B[k][0] - A[k][0];
        if (d >= 0.8 * B[k][2]) (taller[k] = taller[k] || []).push(w);
        if (-d >= 0.8 * B[k][2]) (shorter[k] = shorter[k] || []).push(w);
      }
    }
    res[p] = { taller, shorter };
    const fmt = ws => { const runs = []; let s = ws[0], prev = ws[0]; for (const w of ws.slice(1)) { if (w !== prev + 20) { runs.push(s === prev ? '' + s : s + '-' + prev); s = w; } prev = w; } runs.push(s === prev ? '' + s : s + '-' + prev); return runs.join(','); };
    console.log('== ' + p);
    for (const [k, ws] of Object.entries(taller)) console.log('   TALLER in repo  ' + k.slice(0, 90) + '  @ ' + fmt(ws));
    for (const [k, ws] of Object.entries(shorter)) console.log('   shorter in repo ' + k.slice(0, 90) + '  @ ' + fmt(ws));
  }
  fs.writeFileSync(__dirname + '/wrapsweep.json', JSON.stringify(res));
  await b.close();
})();
