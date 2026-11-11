const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, w] of [['/about/', 320], ['/about/', 1280], ['/pricing/', 320], ['/pricing/', 1280], ['/work/', 1280]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const vw = innerWidth; const all = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && !e.closest('.sr-only') && !e.closest('svg') && getComputedStyle(e).position !== 'fixed'; });
      const where = {}; all.forEach(e => { const k = e.closest('main') ? 'main' : e.closest('header') ? 'header' : e.closest('footer') ? 'footer' : e.closest('.topbar') ? 'topbar' : e.closest('.nav') ? 'nav' : 'other'; where[k] = (where[k] || 0) + 1; });
      return { over: document.documentElement.scrollWidth - vw, where, first: all.slice(0, 4).map(e => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().right)) }; });
    console.log(path, w, JSON.stringify(r));
    await ctx.close();
  }
  // focus: is each focused element fully in view once scrolling settles?
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(600);
    const out = [];
    for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(120);
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); const hdr = document.querySelector('.site-header').getBoundingClientRect().bottom; const bar = document.querySelector('.mobile-cta.show'); const barTop = bar ? bar.getBoundingClientRect().top : innerHeight;
        return { t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 22), main: !!e.closest('main'), footer: !!e.closest('footer'), topClear: Math.round(r.top - 6 - hdr), bottomClear: Math.round(barTop - (r.bottom + 6)) }; });
      if (!s) break; if (s.footer) break; if (s.main && (s.topClear < 0 || s.bottomClear < 0)) out.push(s); }
    console.log(`focus @${w}: stops whose 6px ring is under the header or past the bottom (or phone bar):`, JSON.stringify(out));
    await ctx.close();
  }
  await b.close();
})();
