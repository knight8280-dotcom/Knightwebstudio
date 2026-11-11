const { chromium, firefox } = require('playwright');
const base = 'http://localhost:8720'; const S = process.argv[2];
(async () => {
  const b = await chromium.launch();
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active', reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + '/faq/'); await p.waitForTimeout(400);
    console.log('forced colours: burger background =', await p.evaluate(() => getComputedStyle(document.querySelector('.burger')).backgroundColor), '| ::before =', await p.evaluate(() => getComputedStyle(document.querySelector('.burger'), '::before').backgroundColor), '| page bg =', await p.evaluate(() => getComputedStyle(document.body).backgroundColor), '| faq plus image =', await p.evaluate(() => getComputedStyle(document.querySelector('.faq-item summary'), '::after').backgroundImage.slice(0, 40)), '| ticks ::after border =', 'n/a');
    await p.locator('.site-header').screenshot({ path: S + '/forced-header-390.png' }); await p.locator('.faq-item').nth(2).screenshot({ path: S + '/forced-faq-row.png' });
    const q = await ctx.newPage(); await q.goto(base + '/contact/'); await q.waitForTimeout(300); console.log('forced colours: checked chip bg/color =', await q.evaluate(() => { const c = document.querySelector('.chip input'); c.checked = true; const s = getComputedStyle(c.nextElementSibling); return s.backgroundColor + ' / ' + s.color + ' / border ' + s.borderColor; }));
    await ctx.close(); }
  // typing: reveal observer margin vs the phone bar (how far up the bar covers)
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/process/'); await p.waitForTimeout(300); await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(500);
    console.log('phone bar height at 390:', await p.evaluate(() => Math.round(document.getElementById('mobile-cta').getBoundingClientRect().height)), '| shown:', await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'))); await ctx.close(); }
  // checkout success: can the status line be an error?
  await b.close();
  try { const f = await firefox.launch({ executablePath: '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/work/pricing/fix/pw/firefox-1543/firefox/firefox' }); const ctx = await f.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const path of ['/', '/start/', '/web-design-gonzales/']) { const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(300); const hits = [];
      for (let w = 360; w <= 1440; w += 10) { await p.setViewportSize({ width: w, height: 844 }); await p.waitForTimeout(25); const r = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('.tier-plan')) { const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.includes('/mo')); if (!n) continue; const i = n.textContent.indexOf('/mo'); const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1); const a = rg.getClientRects()[0]; rg.setStart(n, i + 1); rg.setEnd(n, i + 2); const c = rg.getClientRects()[0]; if (a && c && Math.abs(a.top - c.top) > 4) out.push(el.textContent.trim().slice(0, 40)); } return out; }); if (r.length) hits.push(w + ':' + r.length); }
      console.log('firefox', path, 'tier-plan lines split between "/" and "mo" at widths:', hits.join(' ') || 'none'); await p.close(); }
    await f.close(); } catch (e) { console.log('firefox not available:', String(e).split('\n')[0]); }
})();
