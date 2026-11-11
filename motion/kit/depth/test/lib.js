// Shared helpers for the checks in this folder. Needs the kit server on :8730 (see run-all.sh).
const path = require('path');
const FLAT = path.resolve(__dirname, '../../../.browsers-flat');   // Firefox and WebKit live here; Chromium is Playwright's default
const engine = name => { if (name !== 'chromium') process.env.PLAYWRIGHT_BROWSERS_PATH = FLAT; return require('playwright')[name]; };
const BASE = 'http://localhost:8730/kit/depth';
const DEMO = BASE + '/demo.html', BARE = BASE + '/test/bare.html', ONE = BASE + '/test/one-ring.html';
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
let fails = 0, passes = 0;
const ok = (c, name, extra = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${name}${extra !== '' ? '  [' + extra + ']' : ''}`); c ? passes++ : fails++; return c; };
const note = s => console.log('      ' + s);
// counts only the animation frames the kit scripts ask for (the site's own main.js is not on trial here)
const counted = ctx => ctx.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { if (/kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack)) window.__raf++; return r.call(window, f); }; });
async function open(b, url, o = {}) {
  const opts = { viewport: { width: o.w || 1280, height: o.h || 900 }, reducedMotion: o.rm ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false, hasTouch: !!o.touch, deviceScaleFactor: o.dpr || (o.touch ? 2 : 1) };
  if (o.touch && !o.noMobile) opts.isMobile = true;
  const ctx = await b.newContext(opts);
  await counted(ctx);
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, o.dark ? 'dark' : 'light');
  if (o.init) await ctx.addInitScript(o.init);
  if (o.block) await ctx.route(o.block, r => r.abort());
  if (o.delay) await ctx.route(o.delay[0], async r => { await new Promise(s => setTimeout(s, o.delay[1])); r.continue(); });
  const p = await ctx.newPage(); p.errs = []; p.ctx = ctx;
  p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.on('pageerror', e => p.errs.push(String(e)));
  await p.goto(url, { waitUntil: o.until || 'load' }); await p.waitForTimeout(o.wait === undefined ? 500 : o.wait);
  return p;
}
const jump = (p, sel, off = -120) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
// the drum
const cur = (p, sel = CYL) => p.evaluate(s => [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), sel);
const settle = (p, sel = CYL) => p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), sel, { timeout: 6000 }).catch(() => 'TIMEOUT');
const drum = (p, sel = CYL) => p.evaluate(s => { const el = document.querySelector(s), cards = [...el.querySelectorAll('.kws-cyl-card:not([aria-hidden])')], on = cards.findIndex(c => c.classList.contains('is-on'));
  return { on, moving: el.classList.contains('is-moving'), held: el.classList.contains('is-held'), tOn: on > -1 ? cards[on].style.transform : '', wc: getComputedStyle(cards[0]).willChange, said: el.querySelector('.kws-cyl-sr').textContent, dot: [...el.querySelectorAll('.kws-cyl-dot')].findIndex(d => d.getAttribute('aria-current')) }; }, sel);
// the ring: where it stands (degrees), what the standing card says, and whether it is at rest
const ring = (p, sel = RING) => p.evaluate(s => { const el = document.querySelector(s), cards = [...el.querySelectorAll('.kws-ring-card')], up = [...el.querySelectorAll('.kws-ring-read')].filter(r => +r.style.opacity > .99)[0];
  const m = cards[0] ? /rotateY\(([-\d.e]+)deg\) translateZ/.exec(cards[0].style.transform) : null;
  return { ang: m ? +m[1] : null, n: cards.length, up: up ? up.lastChild.textContent : '', tab: up ? up.firstChild.textContent : '', upT: up ? up.style.transform : '', words: up ? up.lastChild.style.opacity : '', all: cards.map(c => c.style.transform).join('|') }; }, sel);
// touch gestures through the browser's own input pipeline (Chromium)
const finger = async (p, pts, gap = 16) => { const cdp = p.cdp || (p.cdp = await p.ctx.newCDPSession(p));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1], id: 1 }] });
  for (const q of pts.slice(1)) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: q[0], y: q[1], id: 1 }] }); await p.waitForTimeout(gap); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const line = (x0, y0, x1, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
const done = () => { console.log(`\n${passes} passed, ${fails} failed`); return fails; };
module.exports = { engine, BASE, DEMO, BARE, ONE, CYL, RING, ok, note, open, jump, cur, settle, drum, ring, finger, line, done, counted };
