// Width sweep of script-driven states + static pages: page overflow, element poke-out, clipped text, sibling overlap
const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const STATIC = { 'privacy': { url: '/privacy/' }, 'terms': { url: '/terms/' } };
const ALL = Object.assign({}, STATIC, S);
const names = (process.argv[2] || 'privacy,terms,co-care,co-loading,co-serverdown,co-noplan,co-blocked,ok-ach,ok-care-paid,ok-longlabel,ok-unpaid,ok-confirming').split(',');
const zoom = process.argv[3] ? +process.argv[3] : 1;
(async () => {
  const browser = await chromium.launch();
  for (const name of names) {
    const s = ALL[name];
    const { ctx, page } = await open(browser, s, 'd-light', { rm: 'reduce' });
    await page.goto(base + s.url, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    if (zoom !== 1) await page.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
    const fails = [];
    for (let w = (zoom !== 1 ? 320 : 320); w <= 1920; w += 20) {
      await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(50);
      const r = await page.evaluate(() => {
        const out = [];
        const over = document.documentElement.scrollWidth - innerWidth;
        if (over > 0) out.push('page +' + over);
        const sel = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
        const vis = el => { const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); return rc.width > 0 && rc.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], .sr-only, .hp, svg'); };
        for (const el of document.querySelectorAll('main *, .site-header *, .topbar *, footer *')) {
          if (!vis(el)) continue; const cs = getComputedStyle(el); if (cs.position === 'fixed') continue;
          if (el.closest('.nav') && getComputedStyle(el.closest('.nav')).visibility === 'hidden') continue;
          const rc = el.getBoundingClientRect();
          if (rc.right > innerWidth + 0.5 || rc.left < -0.5) out.push('pokes out ' + Math.round(Math.max(rc.right - innerWidth, -rc.left)) + ' ' + sel(el));
          // text wider than its box
          if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 1 && cs.display !== 'inline') out.push('clipped ' + (el.scrollWidth - el.clientWidth) + ' ' + sel(el) + ' "' + el.textContent.trim().slice(0, 30) + '"');
          // child wider than parent content box (within main)
          const p = el.parentElement; if (p && el.closest('main')) { const pr = p.getBoundingClientRect(); if (rc.right > pr.right + 1.5 && getComputedStyle(p).display !== 'inline' && cs.position !== 'absolute') out.push('wider than parent by ' + Math.round(rc.right - pr.right) + ' ' + sel(el) + ' in ' + sel(p)); }
        }
        // sibling overlap among till / split children
        for (const wrap of document.querySelectorAll('main .split, main .till-next, main .stack, main .btn-row, main .page-head .container')) {
          const kids = [...wrap.children].filter(vis);
          for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
            const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ox > 1 && oy > 1) out.push('overlap ' + Math.round(ox) + 'x' + Math.round(oy) + ' ' + sel(kids[i]) + ' / ' + sel(kids[j]));
          }
        }
        return [...new Set(out)];
      });
      if (r.length) fails.push(w + 'px: ' + r.join(' ; '));
    }
    console.log(name, zoom !== 1 ? '(text ' + zoom * 100 + '%)' : '', fails.length ? '\n  ' + fails.join('\n  ') : 'clean 320-1920');
    await ctx.close();
  }
  await browser.close();
})();
