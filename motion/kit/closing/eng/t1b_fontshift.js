// Late fonts while the reader is at the page end: kit pages against today's pages (same scenario), and which kit element changes size.
const { launch, BLOCK } = require('./common');
(async () => {
  const b = await launch();
  const CLS = () => {
    window.__cls = { total: 0, entries: [] };
    new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__cls.total += e.value;
      window.__cls.entries.push({ v: +e.value.toFixed(5), src: (e.sources || []).map(s => { const n = s.node && (s.node.nodeType === 1 ? s.node : s.node.parentElement); return n ? n.tagName + '.' + String(n.className).split(' ').slice(0, 2).join('.') + ' dy=' + Math.round(s.currentRect.y - s.previousRect.y) + ' dh=' + Math.round(s.currentRect.height - s.previousRect.height) : '?'; }) }); } }).observe({ type: 'layout-shift', buffered: true });
  };
  for (const [label, url] of [['kit start', 'http://localhost:8730/kit/closing/test/start-with-kit.html'], ['today start', 'http://localhost:8730/start/'], ['kit pricing', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html'], ['today pricing', 'http://localhost:8730/pricing/']]) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    await c.route(BLOCK, r => r.abort());
    await c.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, 2500)); r.continue(); });
    await c.addInitScript(CLS);
    const p = await c.newPage();
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
    const sizes = () => p.evaluate(() => [...document.querySelectorAll('.kws-close-title, .kws-close-text, .kws-close-btn, .kws-close-tel, .kws-appt, .kws-appt-title, .kws-foot-tel, .kws-foot-bye, .kws-foot-logo, .kws-skyline, .kws-skyline-name, .cta-band h2, .cta-band, .site-footer')].map(e => String(e.className).split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().height)).join(' '));
    await p.waitForTimeout(600);
    const before = await sizes();
    await p.waitForTimeout(4000);
    const after = await sizes();
    const r = await p.evaluate(() => window.__cls);
    console.log(`${label} ${w}: CLS ${r.total.toFixed(4)} | ${JSON.stringify(r.entries).slice(0, 700)}\n   fallback font: ${before}\n   web font:      ${after}`);
    await c.close();
  }
  await b.close();
})();
