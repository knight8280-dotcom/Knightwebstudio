const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('nojs', { recursive: true });
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 500, hasTouch: w < 500 });
    const p = await ctx.newPage(); const failed = []; p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.screenshot({ path: `nojs/${path.replace(/\//g, '')}_${w}.png`, fullPage: true });
    // evaluate still works with JS disabled in Playwright (uses devtools), check
    const r = await p.evaluate(() => {
      const out = { htmlClass: document.documentElement.className, invisible: [], controls: [], height: document.documentElement.scrollHeight };
      for (const el of document.querySelectorAll('main *, .site-header *, .topbar *')) { if (el.closest('svg,.sr-only')) continue; const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue; if (+cs.opacity < 1 || (cs.transform !== 'none' && el.classList.contains('reveal'))) out.invisible.push(el.tagName + '.' + el.className + ' opacity ' + cs.opacity + ' transform ' + cs.transform); }
      for (const el of document.querySelectorAll('button, [data-booking], #mobile-cta, #nav, .nav-toggle, .header-tel')) { const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); out.controls.push((el.id || el.className.toString().split(' ').slice(0, 3).join('.')) + ': ' + (cs.display === 'none' || cs.visibility === 'hidden' || !rc.width || el.hidden || el.closest('[hidden]') ? 'hidden' : 'VISIBLE ' + Math.round(rc.width) + 'x' + Math.round(rc.height)) + (el.getAttribute('href') ? ' href=' + el.getAttribute('href') : '')); }
      out.imgs = [...document.querySelectorAll('main img')].map(i => i.getAttribute('src') + ' complete=' + i.complete + ' natural=' + i.naturalWidth);
      return out;
    });
    console.log('==', path, w, JSON.stringify(r, null, 1), failed);
    await ctx.close();
  }
  await b.close();
})();
