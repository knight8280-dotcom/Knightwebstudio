// Working aid: node look.js <out.png> <width> <height> <light|dark> <selector> [offset] [js to run before the shot] [page]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const [out, w, h, theme, sel, off = '80', js = '', page = 'demo.html', rm = ''] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 700 ? 2 : 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8730/kit/flat/' + page, { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - o); }, [sel, +off]);
  await p.waitForTimeout(250);
  if (js) { const r = await p.evaluate(js); if (r !== undefined) console.log(JSON.stringify(r)); await p.waitForTimeout(900); }
  await p.screenshot({ path: out });
  if (errs.length) console.log('ERRORS', errs.join(' | '));
  await b.close();
})();
