const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
function lum(c) { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); }
(async () => {
  const b = await chromium.launch();
  for (const p of ['/', '/pricing/', '/consulting/', '/contact/', '/start/']) {
    const ctx = await b.newContext({ viewport: { width: 816, height: 1056 } });
    const page = await ctx.newPage();
    await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    // text nodes whose colour is too pale for white paper (backgrounds are not printed by default)
    const pale = await page.evaluate(() => {
      const out = {}; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        if (!n.nodeValue.trim()) continue; const e = n.parentElement; if (!e || !e.getClientRects().length) continue;
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        if (e.closest('svg')) continue;
        const key = e.tagName + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
        (out[key] = out[key] || { color: cs.color, n: 0, sample: n.nodeValue.trim().slice(0, 40) }).n++;
      }
      return out;
    });
    const bad = Object.entries(pale).map(([k, v]) => [k, v, (1.05) / (lum(v.color) + .05)]).filter(x => x[2] < 3);
    const hidden = await page.evaluate(() => ['.topbar', '.site-header', '.site-footer', '.cta-band', '.mobile-cta'].map(s => { const e = document.querySelector(s); return s + ':' + (e ? getComputedStyle(e).display : 'absent'); }));
    console.log('==', p, 'print media;', hidden.join(' '));
    for (const [k, v, cr] of bad) console.log('   pale text', cr.toFixed(2) + ':1 on white', v.color, 'x' + v.n, k, JSON.stringify(v.sample));
    const slug = p.replace(/\//g, '') || 'home';
    await page.pdf({ path: __dirname + '/print/' + slug + '.pdf', format: 'Letter' });
    await page.pdf({ path: __dirname + '/print/' + slug + '-bg.pdf', format: 'Letter', printBackground: true });
    await ctx.close();
  }
  await b.close();
})();
