// LCP element, FCP, render-blocking and eager loads on a throttled connection (Slow 4G: 1.6 Mbps, 150 ms RTT) with 4x CPU throttle.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const BASE = (process.argv.find(a => a.startsWith('--base=')) || '--base=http://127.0.0.1:8731').slice(7);
const NET = (process.argv.find(a => a.startsWith('--net=')) || '--net=slow4g').slice(6);
const NETS = { slow4g: { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 }, slow3g: { latency: 400, down: 400e3 / 8, up: 400e3 / 8 }, edge: { latency: 800, down: 120e3 / 8, up: 60e3 / 8 } };
const PAGES = (process.argv.find(a => a.startsWith('--pages=')) || '--pages=/,/start/,/pricing/,/consulting/,/contact/,/services/,/work/,/process/,/faq/,/about/,/web-design-baton-rouge/,/privacy/,/checkout/,/404.html').slice(8).split(',');
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [vw, vh] of [[390, 844], [1280, 800]]) for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500, deviceScaleFactor: vw < 500 ? 3 : 1 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.addInitScript(() => {
      window.__lcp = []; window.__paint = {};
      const d = n => { if (!n) return '(none)'; return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).join('.') : (n.className && n.className.baseVal ? '.' + n.className.baseVal : '')); };
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: d(e.element), tag: e.element ? e.element.tagName : null, url: e.url || '', txt: e.element ? e.element.textContent.trim().replace(/\s+/g, ' ').slice(0, 50) : '' }); }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__paint[e.name] = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true });
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NETS[NET].latency, downloadThroughput: NETS[NET].down, uploadThroughput: NETS[NET].up });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now(); const reqs = [];
    page.on('requestfinished', async r => { try { const tm = r.timing(); reqs.push({ u: r.url().replace(BASE, ''), type: r.resourceType(), end: Date.now() - t0 }); } catch (e) {} });
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ lcp: window.__lcp, paint: window.__paint, nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), enc: n.encodedBodySize }; })(), res: performance.getEntriesByType('resource').map(e => ({ n: e.name.replace(location.origin, ''), rb: e.renderBlockingStatus, start: Math.round(e.startTime), end: Math.round(e.responseEnd), size: e.transferSize, init: e.initiatorType })) }));
    const last = r.lcp[r.lcp.length - 1] || {};
    out[`${p}@${vw}`] = r;
    console.log(`${(p + '@' + vw).padEnd(32)} TTFB ${r.nav.ttfb} FCP ${r.paint['first-contentful-paint']} LCP ${last.t} <${last.el}> "${last.txt}" ${last.url ? 'IMG ' + last.url : 'text'} | DCL ${r.nav.dcl} load ${r.nav.load}`);
    console.log('      blocking: ' + r.res.filter(x => x.rb === 'blocking').map(x => x.n + ' ' + x.size + 'B done@' + x.end).join(', ') + ' | all: ' + r.res.map(x => x.n.split('/').pop() + '@' + x.start + '-' + x.end).join(' '));
    await ctx.close();
  }
  fs.writeFileSync(__dirname + `/lcp-${NET}-${BASE.slice(-4)}.json`, JSON.stringify(out, null, 1));
  await browser.close();
})();
