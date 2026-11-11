// Shared helpers for the independent engineering review. Nothing here touches the kit files.
const { chromium, firefox, webkit } = require('playwright');
const BASE = 'http://localhost:8730/kit/depth';
const DEMO = BASE + '/demo.html', BARE = BASE + '/test/bare.html', ONE = BASE + '/test/one-ring.html';
const out = [];
const log = (...a) => { const s = a.join(' '); console.log(s); out.push(s); };
const ok = (c, name, extra = '') => log(`${c ? 'PASS' : 'FAIL'}  ${name}${extra !== '' ? '  [' + extra + ']' : ''}`);
// count rAF requests made by the kit scripts only
const counted = ctx => ctx.addInitScript(() => { window.__raf = 0; window.__rafRun = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { if (/kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack)) { window.__raf++; return r.call(window, t => { window.__rafRun++; f(t); }); } return r.call(window, f); }; });
async function open(b, url, o = {}) {
  const ctx = await b.newContext({ viewport: { width: o.w || 1280, height: o.h || 900 }, reducedMotion: o.rm ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false, hasTouch: !!o.touch, isMobile: !!o.touch, deviceScaleFactor: o.dpr || (o.touch ? 2 : 1), colorScheme: o.dark ? 'dark' : 'light' });
  await counted(ctx); if (o.init) await ctx.addInitScript(o.init);
  if (o.route) await o.route(ctx);
  const p = await ctx.newPage(); p.errs = [];
  p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.on('pageerror', e => p.errs.push(String(e)));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(o.wait === undefined ? 600 : o.wait);
  p.ctx = ctx;
  return p;
}
const jump = (p, sel, off = -120) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
const cur = (p, sel) => p.evaluate(s => [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), sel);
const settle = (p, sel) => p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), sel, { timeout: 6000 }).catch(() => 'TIMEOUT');
module.exports = { chromium, firefox, webkit, BASE, DEMO, BARE, ONE, log, ok, open, jump, cur, settle, out };
