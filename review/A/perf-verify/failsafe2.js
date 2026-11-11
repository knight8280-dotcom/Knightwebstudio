const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8720';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(label, p, opts) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__log = [];
    const t0 = performance.now();
    const note = (m) => window.__log.push(Math.round(performance.now()) + 'ms ' + m);
    let last = null; new MutationObserver(() => { const d = document.documentElement; if (!d) return; if (d.className !== last) { last = d.className; note('html class = "' + last + '"'); } }).observe(document, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    try { new PerformanceObserver(l => l.getEntries().forEach(e => note('PAINT ' + e.name + ' at ' + Math.round(e.startTime)))).observe({ type: 'paint', buffered: true }); } catch (e) {}
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) note('SHIFT ' + e.value.toFixed(4) + ' at ' + Math.round(e.startTime) + ' ' + (e.sources || []).slice(0, 3).map(s => (s.node && (s.node.nodeName + (s.node.className ? '.' + String(s.node.className).split(' ')[0] : ''))) + ' ' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).join(' | ')); })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  });
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (opts.cssDelay && u.includes('styles.css')) await sleep(opts.cssDelay);
    if (opts.jsDelay && u.includes('main.js')) await sleep(opts.jsDelay);
    if (opts.jsBlock && u.includes('main.js')) return r.abort();
    r.continue();
  });
  page.goto(BASE + p).catch(() => {});
  for (const t of (opts.shots || [])) { await sleep(t.wait); await page.screenshot({ path: __dirname + '/fixed-failsafe-' + label + '-' + t.name + '.png' }).catch(() => {}); }
  await sleep(opts.total || 9000);
  const log = await page.evaluate(() => window.__log);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity === '0').length);
  console.log('== ' + label + ' ' + p); console.log(log.join('\n')); console.log('reveal blocks still at opacity 0 at end:', hidden);
  await b.close();
}
(async () => {
  const which = process.argv[2];
  if (!which || which === 'css') for (let i = 0; i < 3; i++) await run('cssslow' + i, '/', { cssDelay: 6000, total: 9000 });
  if (!which || which === 'js') await run('jsslow', '/', { jsDelay: 6500, total: 9000, shots: [{ wait: 3000, name: 'at3s' }, { wait: 2000, name: 'at5s' }, { wait: 2500, name: 'at7.5s' }] });
  if (!which || which === 'block') await run('jsblock', '/', { jsBlock: true, total: 2000, shots: [{ wait: 1500, name: 'at1.5s' }, { wait: 3500, name: 'at5s' }] });
  if (!which || which === 'block') await run('jsblock-start', '/start/', { jsBlock: true, total: 2000, shots: [{ wait: 1500, name: 'at1.5s' }, { wait: 3500, name: 'at5s' }] });
})();
