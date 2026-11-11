// Per-section scroll-through, backgrounds running vs paused, 4x CPU throttle. 8px per frame, instant scrolling.
const { launch, ctx, URL } = require('./common');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DSF = +(process.argv[4] || 1), THR = +(process.argv[5] || 4);
const stats = a => { if (!a.length) return 'n=0'; const s = a.slice().sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return `n=${String(a.length).padStart(4)} med ${q(.5).toFixed(1)} p95 ${q(.95).toFixed(1).padStart(5)} worst ${s[s.length - 1].toFixed(1).padStart(6)} >50ms:${String(a.filter(x => x > 50).length).padStart(3)}`; };
(async () => {
  const b = await launch();
  console.log(`viewport ${W}x${H}@${DSF}, throttle ${THR}x, load ${require('os').loadavg()[0].toFixed(1)}`);
  const res = {};
  for (const mode of ['on', 'off', 'on', 'off']) {
    const c = await ctx(b, { viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: W < 600, isMobile: W < 600 });
    const p = await c.newPage(); await p.addInitScript(m => { try { localStorage.setItem('kws-motion', m); } catch (e) {} }, mode);
    const s = await c.newCDPSession(p);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    await p.evaluate(async () => { for (const e of document.querySelectorAll('main > section')) { e.scrollIntoView({ block: 'start', behavior: 'instant' }); await new Promise(r => setTimeout(r, 300)); } scrollTo({ top: 0, behavior: 'instant' }); });
    await p.waitForTimeout(600);
    await s.send('Emulation.setCPUThrottlingRate', { rate: THR });
    const secs = await p.evaluate(() => [...document.querySelectorAll('main > section')].map(e => ({ id: e.id || e.className.split(' ')[0], top: e.offsetTop, h: e.offsetHeight })));
    for (const sec of secs) {
      const f = await p.evaluate(({ top, h }) => new Promise(res => { const f = []; let last = 0, y = Math.max(0, top - innerHeight * .5); const end = top + h - innerHeight * .5; scrollTo({ top: y, behavior: 'instant' }); const step = t => { if (last) f.push(t - last); last = t; y += 8; scrollTo({ top: y, behavior: 'instant' }); if (y >= end || f.length > 400) res(f); else requestAnimationFrame(step); }; setTimeout(() => requestAnimationFrame(step), 400); }), sec);
      (res[sec.id] = res[sec.id] || []).push(`${mode.padEnd(3)} ${stats(f)}`);
    }
    await c.close();
  }
  for (const k in res) { console.log(k); res[k].forEach(l => console.log('   ' + l)); }
  console.log('load after', require('os').loadavg()[0].toFixed(1));
  await b.close();
})();
