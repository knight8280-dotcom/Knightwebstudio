// Where does the desktop band's cost go under software WebGL? One page at a time: all on; no glints; glints only (canvas removed); paused.
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const os = require('os');
const q = (s, p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900), DSF = +(process.argv[4] || 1);
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  console.log(`${W}x${H} at ${DSF}x, CPU throttled 4x, closing band, load`, os.loadavg()[0].toFixed(1));
  const V = { 'all on': () => {}, 'smooth glints (old)': () => { const st = document.createElement('style'); st.textContent = '.is-seen > .kws-glints i { animation: kws-glint 4s ease-in -1s infinite alternate !important }'; document.head.appendChild(st); }, 'no glints': () => { document.querySelectorAll('.kws-glints').forEach(g => g.style.display = 'none'); }, 'glints only': () => { document.querySelectorAll('.kws-shader').forEach(el => { const g = el.querySelector('.kws-glints'); const keep = g && g.cloneNode(true); KWS.shader.mount(el)(); if (keep) { el.appendChild(keep); el.classList.add('is-seen'); } }); }, 'paused': () => KWS.motion.set(true) };
  const res = {};
  for (let pass = 0; pass < 2; pass++) for (const k in V) {
    const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF }); await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); const p = await c.newPage(); await p.addInitScript(() => { try { localStorage.setItem('kws-motion', 'on'); } catch (e) {} }); await p.goto('http://localhost:8730/kit/light/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(2200); await p.evaluate(() => { const r = document.querySelector('.cta-band').getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 110, behavior: 'instant' }); }); await p.waitForTimeout(800); await p.evaluate(V[k]); await p.waitForTimeout(500); const s = await c.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const f = await p.evaluate(() => new Promise(res => { const f = []; let last = 0; const t0 = performance.now(); const loop = t => { if (last) f.push(t - last); last = t; if (performance.now() - t0 < 4000) requestAnimationFrame(loop); else res(f); }; requestAnimationFrame(loop); })); (res[k] = res[k] || []).push(...f); await c.close();
  }
  for (const k in res) { const s = res[k].sort((a, b) => a - b); console.log(k.padEnd(20), 'frames', String(s.length).padStart(4), ' median', q(s, .5).toFixed(1), ' p95', q(s, .95).toFixed(1).padStart(5), ' worst', s[s.length - 1].toFixed(1).padStart(6), ' over 50ms', s.filter(x => x > 50).length); }
  console.log('load after', os.loadavg()[0].toFixed(1)); await b.close();
})();
