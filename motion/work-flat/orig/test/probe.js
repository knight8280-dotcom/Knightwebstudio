// node test/probe.js '<js expression evaluated in the page>' [--w 1440 --h 900 --theme light --rm 0]
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +arg('w', 1440), height: +arg('h', 900) }, reducedMotion: arg('rm', '0') === '1' ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, arg('theme', 'light'));
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(arg('url', 'http://localhost:8730/kit/flat/demo.html'), { waitUntil: 'load' }); await p.waitForTimeout(400);
  console.log(JSON.stringify(await p.evaluate(process.argv[2]), null, 1));
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
