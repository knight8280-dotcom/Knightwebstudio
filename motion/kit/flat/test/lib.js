// Shared by the checks in this folder.
const pw = require('/opt/node-tools/node_modules/playwright');
const BASE = 'http://localhost:8730/kit/flat/';
const A = '#services .kws-arc', S = '#work .kws-spot';
let failed = 0;
const say = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail === '' ? '' : '  (' + detail + ')'}`); if (!ok) failed++; return ok; };
const done = async b => { if (b) await b.close(); process.exit(failed ? 1 : 0); };
const open = async (b, o = {}, page = 'demo.html') => {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, o));
  // count every animation frame asked for (the kit keeps its own reference, so this has to be in place before it loads)
  await ctx.addInitScript(() => { window.__n = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__n++; return r.call(window, f); }; });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(BASE + page, { waitUntil: 'load' }); await p.waitForTimeout(350);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  return { ctx, p, errs };
};
const on = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s + ' > ul > li')].findIndex(li => li.classList.contains('is-on')), sel);
const bring = async (p, sel, top = 160) => { await p.evaluate(([s, t]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - t); }, [sel, top]); await p.waitForTimeout(250); };
// Real touch input through the DevTools protocol
const swipe = async (p, cdp, x0, y0, x1, y1, { steps = 12, gap = 16, hold = 0 } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }] }); await p.waitForTimeout(gap); }
  if (hold) await p.waitForTimeout(hold);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
// BROWSER=firefox or BROWSER=webkit runs a check in that engine instead (those that do not need the DevTools protocol)
module.exports = { pw, chromium: pw[process.env.BROWSER || 'chromium'], BASE, A, S, say, done, open, on, bring, swipe };
