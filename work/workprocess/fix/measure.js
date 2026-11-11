// node measure.js : page heights, row alignment on /work/, ticket geometry on /process/
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 360, 375, 390, 414, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const out = [];
    for (const path of ['/work/', '/process/']) {
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
      out.push(path + ' ' + await p.evaluate(() => document.documentElement.scrollHeight));
      if (path === '/process/') {
        out.push(await p.evaluate(() => {
          const st = document.querySelector('.stamp').getBoundingClientRect(), tk = document.querySelector('.ticket').getBoundingClientRect(), cta = document.querySelector('.cta-band').getBoundingClientRect();
          const wraps = [...document.querySelectorAll('.steps dl div')].filter(d => d.getBoundingClientRect().height > 34).length;
          return `stampBelowTicket ${Math.round(st.bottom - tk.bottom)} stampToBand ${Math.round(cta.top - 16 - st.bottom)} wrappedTerms ${wraps} ticketW ${Math.round(tk.width)}`;
        }));
      }
      await p.close();
    }
    console.log(w, out.join(' | '));
    await ctx.close();
  }
  for (const w of [980, 1000, 1040, 1100, 1180, 1280, 1300, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    let p = await ctx.newPage(); await p.goto('http://localhost:8720/work/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.case')].map(c => { const f = c.querySelector('.browser').getBoundingClientRect(), t = c.querySelector('.case-copy').getBoundingClientRect(); return `top ${Math.round(t.top - f.top)} bottom ${Math.round(t.bottom - f.bottom)} frame ${Math.round(f.width)}x${Math.round(f.height)} copyW ${Math.round(t.width)}`; }).join(' ; '));
    await p.close();
    p = await ctx.newPage(); await p.goto('http://localhost:8720/process/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const tk = await p.evaluate(() => [...document.querySelectorAll('.steps > li')].map(li => { const h = li.querySelector('h2'), we = li.querySelector('h2 + p'), you = li.querySelector('.steps-you'); const r = el => el.getBoundingClientRect(); const lines = Math.round(r(h).height / parseFloat(getComputedStyle(h).lineHeight)); return `h2 ${Math.round(r(h).width)}/${lines}l we ${Math.round(r(we).width)} you ${Math.round(r(you).width)} we-you-top ${Math.round(r(we).top - r(you).top)}`; }).join(' ; '));
    await p.close();
    console.log(w, 'WORK', rows); console.log(w, 'PROC', tk);
    await ctx.close();
  }
  await b.close();
})();
