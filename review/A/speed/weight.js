// First-visit weight: every request, raw bytes and gzip bytes for text (GitHub Pages gzips text).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const zlib = require('zlib');
const TP = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [name, base] of [['new', 'http://localhost:8720'], ['old', 'http://localhost:8700']]) {
    for (const p of ['/', '/start/', '/pricing/', '/consulting/', '/contact/', '/work/']) {
      for (const [vw, vh, mob] of [[390, 844, true], [1280, 800, false]]) {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 3 : 1 });
        const page = await ctx.newPage();
        const reqs = []; const third = [];
        await ctx.route(TP, r => { third.push(r.request().url()); r.abort(); });
        page.on('response', async r => {
          try {
            const u = r.url(); if (TP.test(u)) return;
            const b = await r.body();
            const ct = r.headers()['content-type'] || '';
            const text = /html|css|javascript|json|svg|xml|text/.test(ct);
            reqs.push({ u: u.replace(base, ''), raw: b.length, tx: text ? zlib.gzipSync(b, { level: 6 }).length : b.length, type: r.request().resourceType() });
          } catch (e) {}
        });
        await page.goto(base + p, { waitUntil: 'load' });
        await page.waitForTimeout(5000); // let the 4s captcha backstop etc fire
        const atLoad = reqs.slice();
        // scroll to the bottom to trigger lazy stuff
        await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } });
        await page.waitForTimeout(800);
        const sum = a => a.reduce((s, r) => s + r.tx, 0), sumr = a => a.reduce((s, r) => s + r.raw, 0);
        const by = {}; for (const r of atLoad) { by[r.type] = by[r.type] || { n: 0, raw: 0, tx: 0 }; by[r.type].n++; by[r.type].raw += r.raw; by[r.type].tx += r.tx; }
        out[`${name} ${p} ${vw}`] = { firstView: { n: atLoad.length, raw: sumr(atLoad), tx: sum(atLoad), by }, afterScroll: { n: reqs.length, raw: sumr(reqs), tx: sum(reqs) }, lazy: reqs.slice(atLoad.length).map(r => r.u + ' ' + r.raw), list: atLoad.map(r => `${r.type} ${r.u} raw=${r.raw} tx=${r.tx}`), third: [...new Set(third)] };
        await ctx.close();
      }
    }
  }
  require('fs').writeFileSync(__dirname + '/weight.json', JSON.stringify(out, null, 1));
  for (const k in out) { const o = out[k]; console.log(k.padEnd(26), 'first:', String(o.firstView.n).padStart(2), 'req', String(o.firstView.raw).padStart(7), 'raw', String(o.firstView.tx).padStart(7), 'tx | all:', o.afterScroll.n, o.afterScroll.tx, '| 3p:', o.third.map(u => u.split('/')[2]).join(',')); }
  await browser.close();
})();
