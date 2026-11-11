const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, colorScheme: scheme });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.screenshot({ path: `nojs_${w}_${scheme}_top.png` });
    // Playwright can still evaluate in the page with JS disabled
    const r = await p.evaluate(() => {
      const o = {}; o.htmlClass = document.documentElement.className; o.theme = document.documentElement.getAttribute('data-theme'); o.bg = getComputedStyle(document.body).backgroundColor;
      o.faded = []; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (el.closest('svg')) continue; if (+cs.opacity < 1 && el.getBoundingClientRect().width > 0) o.faded.push(el.tagName + '.' + el.className + ' ' + cs.opacity); if (cs.visibility === 'hidden' && !el.closest('.sr-only')) o.faded.push('hidden ' + el.className); }
      o.booking = [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href') + ' vis=' + (a.getBoundingClientRect().width > 0));
      const disp = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display + (e.hidden ? ' [hidden]' : '') : 'none-in-dom'; };
      o.themeToggle = disp('#theme-toggle'); o.navToggle = disp('#nav-toggle'); o.mobileCta = disp('#mobile-cta'); o.nav = disp('#nav') + ' ' + getComputedStyle(document.querySelector('#nav')).visibility; o.headerPos = getComputedStyle(document.querySelector('.site-header')).position;
      o.navLinks = [...document.querySelectorAll('.nav-links a')].map(a => Math.round(a.getBoundingClientRect().width) + 'x' + Math.round(a.getBoundingClientRect().height)).join(' ');
      o.height = document.documentElement.scrollHeight; o.over = document.documentElement.scrollWidth - innerWidth; o.progress = disp('#scroll-progress');
      return o;
    });
    console.log(w, scheme, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
