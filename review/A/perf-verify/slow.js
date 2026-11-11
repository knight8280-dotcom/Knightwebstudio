const { chromium } = require('playwright');
const BASE = 'http://localhost:8734';
const NET = { 'slow3g': { downloadThroughput: 500 * 1024 / 8 * .8, uploadThroughput: 500 * 1024 / 8 * .8, latency: 400 * 5 }, 'fast3g': { downloadThroughput: 1.6 * 1024 * 1024 / 8 * .9, uploadThroughput: 750 * 1024 / 8 * .9, latency: 150 * 3.75 }, '2g-ish 250kbps': { downloadThroughput: 250 * 1024 / 8, uploadThroughput: 50 * 1024 / 8, latency: 300 } };
(async () => {
  for (const [name, net] of Object.entries(NET)) for (const p of ['/', '/start/', '/pricing/']) {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__log = []; const note = m => window.__log.push(Math.round(performance.now()) + ' ' + m);
      let last = null; new MutationObserver(() => { const d = document.documentElement; if (d && d.className !== last) { last = d.className; note('class="' + last + '"'); } }).observe(document, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => note('PAINT ' + e.name + ' ' + Math.round(e.startTime)))).observe({ type: 'paint', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput && e.value > .001) note('SHIFT ' + e.value.toFixed(3) + ' at ' + Math.round(e.startTime)); })).observe({ type: 'layout-shift', buffered: true });
      document.fonts && document.fonts.addEventListener('loadingdone', e => note('fonts done: ' + e.fontfaces.map(f => f.family).join(',')));
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', Object.assign({ offline: false }, net));
    await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 }).catch(e => console.log('goto', e.message.slice(0, 60)));
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => window.__log);
    const res = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /styles|main\.js|woff2/.test(e.name)).map(e => e.name.split('/').pop() + ' done ' + Math.round(e.responseEnd)).join(', '));
    console.log('==', name, p, '\n  ' + log.join('\n  ') + '\n  ' + res);
    await b.close();
  }
})();
