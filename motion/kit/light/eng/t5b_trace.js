// Who owns the long frames while scrolling the page at 390 with 4x throttle? Trace and attribute tasks > 30ms.
const { launch, ctx, URL } = require('./common');
(async () => {
  const b = await launch();
  const c = await ctx(b, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await c.newPage(); const s = await c.newCDPSession(p);
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await s.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const events = []; s.on('Tracing.dataCollected', d => events.push(...d.value));
  await s.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'toplevel', 'gpu'] } });
  await p.evaluate(() => new Promise(res => { const step = () => { scrollBy(0, 40); if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) res(); else requestAnimationFrame(step); }; requestAnimationFrame(step); }));
  const done = new Promise(r => s.once('Tracing.tracingComplete', r)); await s.send('Tracing.end'); await done;
  const X = events.filter(e => e.ph === 'X' && e.dur);
  const tasks = X.filter(e => (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') && e.dur > 30000).sort((a, b) => b.dur - a.dur).slice(0, 8);
  const threadName = {}; events.filter(e => e.name === 'thread_name').forEach(e => threadName[e.pid + ':' + e.tid] = e.args.name);
  for (const t of tasks) {
    const kids = X.filter(e => e.tid === t.tid && e.pid === t.pid && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e !== t && e.dur > 3000).sort((a, b) => b.dur - a.dur).slice(0, 6).map(e => `${e.name}${e.args && e.args.data && (e.args.data.url || e.args.data.functionName) ? '(' + (e.args.data.functionName || '') + '@' + String(e.args.data.url || '').split('/').pop() + ':' + (e.args.data.lineNumber || '') + ')' : ''} ${(e.dur / 1000).toFixed(1)}ms`);
    console.log(`${(t.dur / 1000).toFixed(1)}ms on ${threadName[t.pid + ':' + t.tid] || t.tid}: ${kids.join(' | ')}`);
  }
  // Layout inside rAF during scroll and which function
  const fa = X.filter(e => e.name === 'FireAnimationFrame');
  const lay = X.filter(e => e.name === 'Layout' && fa.some(f => f.tid === e.tid && e.ts >= f.ts && e.ts + e.dur <= f.ts + f.dur));
  console.log('Layout events inside rAF during scroll:', lay.length, 'total ms', (lay.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1), 'max ms', lay.length ? (Math.max(...lay.map(e => e.dur)) / 1000).toFixed(1) : 0);
  const fc = X.filter(e => e.name === 'FunctionCall' && e.args && e.args.data && /shader\.js/.test(e.args.data.url || ''));
  const d = fc.map(e => e.dur / 1000).sort((a, b) => a - b);
  console.log('shader.js FunctionCall: n', d.length, 'median', d[Math.floor(d.length / 2)].toFixed(2), 'p95', d[Math.floor(d.length * .95)].toFixed(2), 'max', d[d.length - 1].toFixed(2), 'by fn:', [...new Set(fc.filter(e => e.dur > 8000).map(e => e.args.data.functionName + ':' + e.args.data.lineNumber + ' ' + (e.dur / 1000).toFixed(1) + 'ms'))].slice(0, 10).join(', '));
  const layS = X.filter(e => e.name === 'Layout' && fc.some(f => f.tid === e.tid && e.ts >= f.ts && e.ts + e.dur <= f.ts + f.dur));
  console.log('Layout forced inside shader.js calls:', layS.length, layS.map(e => (e.dur / 1000).toFixed(1) + 'ms').join(','));
  const styS = X.filter(e => (e.name === 'UpdateLayoutTree' || e.name === 'RecalculateStyles') && fc.some(f => f.tid === e.tid && e.ts >= f.ts && e.ts + e.dur <= f.ts + f.dur));
  console.log('Style recalcs forced inside shader.js calls:', styS.length, styS.map(e => (e.dur / 1000).toFixed(1) + 'ms').join(','));
  await b.close();
})();
