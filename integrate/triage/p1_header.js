const { chromium } = require('playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const path of ['/', '/pricing/', '/start/']) {
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const rows = [];
    for (let w = 1100; w <= 1400; w += 10) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40);
      const r = await p.evaluate(() => {
        const cta = document.querySelector('.site-header .header-cta, .site-header .header-book'); if (!cta) return null;
        const inner = document.querySelector('.header-inner').getBoundingClientRect();
        const acts = document.querySelector('.header-actions').getBoundingClientRect();
        const rc = cta.getBoundingClientRect();
        const nav = document.querySelector('.nav'); const navr = nav ? nav.getBoundingClientRect() : null;
        return { h: Math.round(rc.height), w: Math.round(rc.width), over: Math.round(acts.right - inner.right), navw: navr ? Math.round(navr.width) : 0 };
      });
      rows.push(w + ':' + (r ? r.h + (r.over > 0 ? '(+' + r.over + ')' : '') : 'n/a'));
    }
    console.log(path, 'header button height by width (top of page):\n  ' + rows.join(' '));
    // scrolled
    await p.setViewportSize({ width: 1280, height: 800 }); await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(500);
    console.log('  1280 scrolled:', JSON.stringify(await p.evaluate(() => { const c = document.querySelector('.site-header .header-cta, .site-header .header-book'); const t = document.querySelector('.header-tel'); return c ? { ctaH: Math.round(c.getBoundingClientRect().height), tel: t ? [getComputedStyle(t).display, getComputedStyle(t).opacity, Math.round(t.getBoundingClientRect().width)] : null } : null; })));
    // widths of the parts at 1280
    console.log('  parts at 1280:', JSON.stringify(await p.evaluate(() => ['.brand', '.nav', '.header-tel', '#theme-toggle', '.header-cta', '.header-inner'].map(s => { const e = document.querySelector('.site-header ' + s) || document.querySelector(s); return e ? s + '=' + Math.round(e.getBoundingClientRect().width) : s + '=none'; }))));
    await p.close();
  }
  // start header under 600: is there a booking button?
  { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); await p.goto(base + '/start/'); await p.waitForTimeout(300);
    console.log('/start/ 390 header:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.site-header a, .site-header button')].map(e => [e.className.split(' ').slice(0, 3).join('.'), getComputedStyle(e).display, Math.round(e.getBoundingClientRect().width)]))));
    await p.close(); }
  // text-only enlargement & text-spacing
  for (const [label, css] of [['root 125%', 'html{font-size:125%}'], ['root 150%', 'html{font-size:150%}'], ['root 200%', 'html{font-size:200%}'], ['WCAG 1.4.12 spacing', '*{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important}']]) {
    for (const w of [390, 1280]) {
      const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 844 }); await p.goto(base + '/pricing/'); await p.addStyleTag({ content: css }); await p.waitForTimeout(250);
      const r = await p.evaluate(() => { const vw = innerWidth; const f = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().right - vw) : null; };
        return { headerActionsOver: f('.header-actions'), navToggleOver: f('#nav-toggle'), ctaOver: f('.header-cta'), topbarTelOver: f('.topbar-tel'), docOver: document.documentElement.scrollWidth - vw }; });
      console.log(label, w, JSON.stringify(r)); await p.close();
    }
  }
  await b.close();
})();
