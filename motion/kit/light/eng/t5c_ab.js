// A/B: same measurements with the backgrounds running vs paused (data-motion=off), 4x CPU throttle. Isolates the kit's cost from machine noise.
const { launch, ctx, URL } = require('./common');
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), DSF = +(process.argv[4] || 3);
const stats = a => { if (!a.length) return 'n=0'; const s = a.slice().sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return `n=${a.length} median ${q(.5).toFixed(1)} p95 ${q(.95).toFixed(1)} p99 ${q(.99).toFixed(1)} worst ${s[s.length - 1].toFixed(1)} >33.4:${a.filter(x => x > 33.4).length} >50:${a.filter(x => x > 50).length}`; };
(async () => {
  const b = await launch();
  console.log(`viewport ${W}x${H}@${DSF}, throttle 4x, load ${require('os').loadavg()[0].toFixed(1)}`);
  for (const mode of ['on', 'off', 'on', 'off']) {
    const c = await ctx(b, { viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: W < 600, isMobile: W < 600 });
    const p = await c.newPage(); await p.addInitScript(m => { try { localStorage.setItem('kws-motion', m); } catch (e) {} window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); }; }, mode);
    const s = await c.newCDPSession(p);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    // warm: visit every section once so first-draw costs (compile, colours) are out of the way
    await p.evaluate(async () => { for (const e of document.querySelectorAll('main > section')) { e.scrollIntoView({ block: 'start', behavior: 'instant' }); await new Promise(r => setTimeout(r, 350)); } scrollTo(0, 0); });
    await p.waitForTimeout(800);
    await s.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const run = async (label, fn) => {
      await p.evaluate(() => { window.__f = []; window.__d0 = window.__draws; let last = 0; window.__stop = false; const loop = t => { if (window.__stop) return; if (last) window.__f.push(t - last); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      await fn();
      const r = await p.evaluate(() => { window.__stop = true; return { f: window.__f, d: window.__draws - window.__d0 }; });
      await p.waitForTimeout(100);
      console.log(`  [motion ${mode}] ${label}: ${stats(r.f)} draws ${r.d}`);
    };
    await run('scroll top→bottom 40px/frame', () => p.evaluate(() => new Promise(res => { const step = () => { scrollBy(0, 40); if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) res(); else requestAnimationFrame(step); }; requestAnimationFrame(step); })));
    for (const [label, sel, blk] of [['second brand 4s', '.demo-brand', 'start'], ['closing band 4s', '.cta-band', 'center'], ['cards 4s', '#services .kws-marks', 'center']]) {
      await p.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b, behavior: 'instant' }), [sel, blk]); await p.waitForTimeout(900);
      await run(label, () => p.waitForTimeout(4000));
    }
    await c.close();
  }
  console.log('load after', require('os').loadavg()[0].toFixed(1));
  await b.close();
})();
