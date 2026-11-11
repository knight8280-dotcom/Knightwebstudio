// Layout shift while the page loads and the scripts upgrade the markup, with and without reduced motion. The kit scripts are
// held back 1.8s on purpose, so the browser paints the held state first and any jump at the upgrade is counted.
// Also compares each component's height held and live.   node test/cls.js
const { engine, DEMO, BARE } = require('./lib');
(async () => {
  const b = await engine('chromium').launch(); let bad = 0;
  for (const [url, name] of [[DEMO, 'demo'], [BARE, 'bare page']]) for (const rm of [false, true]) for (const w of [390, 820, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1400 }, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await new Promise(d => setTimeout(d, 1800)); r.continue(); });
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'commit' }); await p.waitForFunction(() => document.querySelectorAll('.kws-ring-lists').length && document.readyState !== 'complete' && document.fonts.status === 'loaded', null, { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(500);
    if (await p.evaluate(() => document.querySelectorAll('.is-live').length)) console.log('      (measured too late: already live)');
    const size = () => p.evaluate(() => [...document.querySelectorAll('.kws-cyl,.kws-ring-stage')].map(e => Math.round(e.getBoundingClientRect().height)).join('/') + ' doc ' + document.documentElement.scrollHeight);
    const held = await size(), shown = await p.evaluate(() => [...document.querySelectorAll('.kws-cyl')].map(e => [...e.querySelectorAll('.kws-cyl-card')].filter(c => getComputedStyle(c).visibility === 'visible').length).join());
    await p.waitForFunction(() => document.querySelectorAll('.is-live').length === document.querySelectorAll('.kws-cyl,.kws-ring').length, null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(500);
    const r = await p.evaluate(() => new Promise(done => { const out = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.push({ v: +e.value.toFixed(4), src: e.sources.map(s => (s.node && (s.node.className || s.node.nodeName)) + ' ' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).slice(0, 3) }); }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => done(out), 300); }));
    const total = r.reduce((a, c) => a + c.v, 0), live = await size(), fail = total > .005 || held !== live;
    if (fail) bad++;
    console.log(`${fail ? 'FAIL' : 'PASS'}  ${name} ${w}px${rm ? ', reduced motion' : ''}: layout shift ${total.toFixed(4)}; heights held ${held}, live ${live}; cards shown while held: ${shown}${r.length ? '  ' + JSON.stringify(r).slice(0, 300) : ''}`);
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
