// Where the main thread's time goes while the ring turns with a touch scroll (4x CPU throttle): a devtools trace, summed by phase.
//   node test/trace.js [off]     EDITS='[["search","replace"]]' and CSS='...' try changes to ring.js and extra CSS without touching the files
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  if (process.env.EDITS) { let js = require('fs').readFileSync(__dirname + '/../ring.js', 'utf8'); for (const [x, y] of JSON.parse(process.env.EDITS)) { if (!js.includes(x)) throw new Error('not found: ' + x); js = js.replace(x, y); } await ctx.route(/kit\/depth\/ring\.js/, r => r.fulfill({ body: js, contentType: 'text/javascript' })); }
  if (process.env.CSS) await ctx.addInitScript(css => addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.append(st); }), process.env.CSS);
  const p = await ctx.newPage(); await p.goto(process.argv[3] || 'http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(700);
  if (process.env.RUN) await p.evaluate(process.env.RUN);
  if (process.argv[2] === 'off') await p.evaluate(() => document.querySelectorAll('.kws-ring').forEach(el => KWS.ring.mount(el)()));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 700); }); await p.waitForTimeout(600);
  const events = []; cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
  for (let k = 0; k < 2; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] });
    for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40);
  }
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
  // the page's main thread only: the thread that fires animation frames
  const mainEv = events.find(e => e.name === 'FireAnimationFrame' || e.name === 'Layerize' || e.name === 'Commit'); const tid = mainEv && mainEv.tid, pid = mainEv && mainEv.pid;
  const mine = events.filter(e => e.tid === tid && e.pid === pid && e.ph === 'X' && e.dur);
  const tasks = mine.filter(e => e.name === 'RunTask'); const span = (Math.max(...mine.map(e => e.ts + e.dur)) - Math.min(...mine.map(e => e.ts))) / 1000;
  const busy = tasks.reduce((a, e) => a + e.dur, 0) / 1000, frames = mine.filter(e => e.name === 'Commit').length;
  console.log(`main thread: busy ${busy.toFixed(0)}ms of ${span.toFixed(0)}ms (${(busy / span * 100).toFixed(0)}%), ${frames} commits, ${(busy / frames).toFixed(1)}ms of main-thread work per committed frame; longest task ${(Math.max(...tasks.map(e => e.dur)) / 1000).toFixed(1)}ms`);
  // what the long tasks hold
  const long = tasks.filter(e => e.dur > 10000).sort((a, c) => c.dur - a.dur).slice(0, 6);
  for (const t of long) { const inside = mine.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.dur > 800).sort((a, c) => c.dur - a.dur).slice(0, 6).map(e => `${e.name} ${(e.dur / 1000).toFixed(1)}`); console.log(`  long task ${(t.dur / 1000).toFixed(1)}ms: ${inside.join(', ')}`); }
  console.log(`  tasks over 10ms: ${tasks.filter(e => e.dur > 10000).length}, over 16ms: ${tasks.filter(e => e.dur > 16000).length}`);
  events.length = 0; events.push(...mine);
  const sum = {}, n = {};
  for (const e of events) if (e.ph === 'X' && e.dur) { sum[e.name] = (sum[e.name] || 0) + e.dur / 1000; n[e.name] = (n[e.name] || 0) + 1; }
  const top = Object.entries(sum).sort((a, c) => c[1] - a[1]).slice(0, 16);
  console.log(process.argv[2] === 'off' ? 'ring off' : 'ring on');
  for (const [k, v] of top) console.log(`  ${k.padEnd(34)} ${v.toFixed(0).padStart(6)}ms total  ${String(n[k]).padStart(5)} times  ${(v / n[k]).toFixed(2)}ms each`);
  await b.close();
})();
