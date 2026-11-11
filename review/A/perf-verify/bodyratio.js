// Figtree (as styled) vs Arial stand-in (Arimo) at regular and bold: does the body fallback fit in both engine models?
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.route('**/__f/**', r => r.fulfill({ body: fs.readFileSync(__dirname + '/fonts/' + r.request().url().split('/__f/')[1]), contentType: 'font/woff2' }));
  const acc = {};
  for (const p of ['/', '/pricing/', '/start/', '/consulting/', '/contact/', '/about/']) {
    await page.goto(BASE + p, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
    const rows = await page.evaluate(async () => {
      const ff = new FontFace('AriStand', 'url(/__f/arimo-var.woff2)', { weight: '400 700' }); await ff.load(); document.fonts.add(ff);
      const out = []; const seen = new Set();
      const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) {
        const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t.length < 12) continue; const e = n.parentElement; if (e.closest('svg') || !e.getClientRects().length) continue;
        const cs = getComputedStyle(e); if (!cs.fontFamily.startsWith('Figtree') && !cs.fontFamily.startsWith('"Figtree')) continue;
        if (seen.has(t)) continue; seen.add(t);
        const m = (font) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = `position:absolute;left:-9999px;white-space:nowrap;font-size:${cs.fontSize};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform};font-synthesis:none;${font}`; document.body.appendChild(s); const x = s.getBoundingClientRect().width; s.remove(); return x; };
        const wt = +cs.fontWeight;
        out.push({ wt, fig: m(`font-family:Figtree;font-weight:${wt}`), a4: m('font-family:AriStand;font-weight:400'), a7: m('font-family:AriStand;font-weight:700') });
      }
      return out;
    });
    for (const r of rows) { const k = r.wt >= 600 ? 'bold (600+)' : 'regular (<600)'; (acc[k] = acc[k] || { reg: [], bold: [] }); acc[k].reg.push(r.fig / (r.a4 * 1.01)); acc[k].bold.push(r.fig / (r.a7 * 1.01)); }
  }
  const med = a => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)].toFixed(3) + ' (' + a[0].toFixed(3) + ' to ' + a[a.length - 1].toFixed(3) + ', n=' + a.length + ')'; };
  for (const [k, v] of Object.entries(acc)) console.log('Figtree text', k, '| vs Arial regular x101%:', med(v.reg), '| vs Arial bold x101%:', med(v.bold));
  await b.close();
})();
