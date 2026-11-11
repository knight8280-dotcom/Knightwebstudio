// Which pages ask for the Plausible script (real network), new vs baseline. On localhost Plausible itself
// declines to record ("Ignoring Event: localhost"), so nothing reaches the owner's statistics.
const { launch } = require('./lib');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html', '/no/such/deep/path/'];
(async () => {
  const b = await launch(); const out = {};
  for (const [tag, base] of [['new', 'http://localhost:8720'], ['baseline', 'http://localhost:8700']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route(/onrender\.com|js\.stripe\.com/, r => r.abort());   // no checkout sessions from this pass
    out[tag] = {};
    for (const p of PAGES) {
      const page = await ctx.newPage(); const reqs = [], cons = [], third = new Set();
      page.on('request', r => { const u = r.url(); if (/plausible/.test(u)) reqs.push(r.method() + ' ' + u); try { const h = new URL(u).host; if (!/^localhost/.test(h)) third.add(h); } catch (e) {} });
      page.on('response', r => { if (/plausible/.test(r.url())) reqs.push('  -> ' + r.status()); });
      page.on('console', m => { if (/Ignoring Event|plausible/i.test(m.text())) cons.push(m.text()); });
      const resp = await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1800);
      const st = await page.evaluate(() => ({ fn: typeof window.plausible, hasMain: !!document.querySelector('script[src="/assets/js/main.js"]'), tags: [...document.scripts].filter(s => /plausible/.test(s.src)).map(s => s.src + (s.async ? ' async' : '')), stubQ: window.plausible && window.plausible.q ? window.plausible.q.length : null }));
      out[tag][p] = { http: resp.status(), reqs, cons, st, third: [...third] };
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync('analytics.json', JSON.stringify(out, null, 1));
  for (const p of PAGES) { const n = out.new[p], o = out.baseline[p]; console.log(p.padEnd(30), 'new:', n.http, n.reqs.join(' ').replace('https://plausible.io/js/', '') || 'NO PLAUSIBLE', '| base:', o.http, o.reqs.join(' ').replace('https://plausible.io/js/', '') || 'NO PLAUSIBLE', '| console new:', n.cons.join(';'), '| third-party hosts new:', n.third.join(','), '| base:', o.third.join(',')); }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
