const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const res = await p.evaluate(() => {
      const LONG = 'Wasserversorgungsunternehmensgesellschaft';
      const targets = ['.points li:first-child span', '.pl-name', '.pricelist li p', '.tier-note', '.board-extras dt', '.board-foot p', '.print h3', '.print-kind', '.steps h3', '.steps p', '.cta-copy .write', '.lede', '.section-sub'];
      const out = [];
      for (const s of targets) { const el = document.querySelector(s); if (!el) { out.push(s + ' MISSING'); continue; } const old = el.innerHTML; el.textContent = LONG + ' ' + el.textContent; const over = document.documentElement.scrollWidth - innerWidth; const r = el.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(el); let R = 0; for (const q of range.getClientRects()) R = Math.max(R, q.right); const par = el.closest('li, .board, .print, .ticket, .container') || el.parentElement; const pr = par.getBoundingClientRect(); out.push(`${s}: page over ${over}px, text right ${Math.round(R)} vs container right ${Math.round(pr.right)} ${R > pr.right + 1 ? 'SPILLS ' + Math.round(R - pr.right) + 'px' : 'ok'} ${R > innerWidth ? 'OFF SCREEN' : ''}`); el.innerHTML = old; }
      return out;
    });
    console.log('\n' + w); res.forEach(x => console.log('  ' + x));
    await ctx.close();
  }
  await b.close();
})();
