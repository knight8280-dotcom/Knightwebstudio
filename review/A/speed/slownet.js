// A very slow connection: when does the first screen paint, when does main.js start, does the 4s fail-safe fire first?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const NETS = { gprs: { latency: 500, down: 250e3 / 8, up: 100e3 / 8 },  slow4g: { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 }, slow3g: { latency: 400, down: 400e3 / 8, up: 400e3 / 8 }, edge: { latency: 800, down: 120e3 / 8, up: 60e3 / 8 } };
(async () => {
  const browser = await chromium.launch();
  for (const net of (process.argv[2] || 'slow3g,edge').split(',')) for (const p of (process.argv[3] || '/,/start/,/pricing/,/consulting/').split(',')) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.addInitScript(() => {
      window.__ev = []; const t = () => Math.round(performance.now());
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ev.push([Math.round(e.startTime), 'paint:' + e.name]); }).observe({ type: 'paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.value > 0.003) window.__ev.push([Math.round(e.startTime), 'shift ' + e.value.toFixed(3)]); }).observe({ type: 'layout-shift', buffered: true });
      new MutationObserver(ms => { for (const m of ms) if (m.target === document.documentElement) window.__ev.push([t(), 'html class="' + document.documentElement.className + '"']); }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
      let v; Object.defineProperty(window, 'kwsReady', { get() { return v; }, set(x) { v = x; window.__ev.push([t(), 'main.js started']); }, configurable: true });
    });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NETS[net].latency, downloadThroughput: NETS[net].down, uploadThroughput: NETS[net].up });
    const snap = async f => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(f, Buffer.from(data, 'base64')); };
    const nav = page.goto('http://127.0.0.1:8731' + p, { waitUntil: 'load', timeout: 120000 }).catch(e => console.log('goto', String(e).slice(0, 80)));
    // screenshot right after first paint
    let shot = false; const t0 = Date.now();
    while (Date.now() - t0 < 60000) { const fp = await page.evaluate(() => (window.__ev || []).some(e => /first-contentful/.test(e[1]))).catch(() => false); if (fp) { await snap(`${__dirname}/shots/slow-${net}-${p.replace(/\W/g, '') || 'home'}-atFCP.png`); shot = true; break; } await new Promise(r => setTimeout(r, 100)); }
    await nav; await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ ev: window.__ev.sort((a, b) => a[0] - b[0]), res: performance.getEntriesByType('resource').map(e => e.name.split('/').pop() + ' ' + Math.round(e.startTime) + '-' + Math.round(e.responseEnd)) }));
    console.log(`\n${net} ${p}  events: ` + r.ev.map(e => e[0] + ' ' + e[1]).join(' | ') + '\n   resources: ' + r.res.join(', '));
    await ctx.close();
  }
  await browser.close();
})();
