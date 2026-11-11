// node shot.js <page> <outprefix> [--w 1440] [--h 900] [--theme light|dark] [--wait 2500] [--full] [--reduce] [--sel css] [--dsf 1]
const { chromium } = require('playwright');
const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const has = k => a.includes('--' + k);
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: +arg('w', 1440), height: +arg('h', 900) }, deviceScaleFactor: +arg('dsf', 1), reducedMotion: has('reduce') ? 'reduce' : 'no-preference', colorScheme: arg('theme', 'light'), javaScriptEnabled: !has('nojs'), hasTouch: has('touch') });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, arg('theme', 'light'));
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8730/kit/light/' + a[0]);
  await p.waitForTimeout(+arg('wait', 2500));
  if (arg('scroll')) { await p.evaluate(y => window.scrollTo(0, y), +arg('scroll')); await p.waitForTimeout(1200); }
  if (arg('sel')) { const el = p.locator(arg('sel')).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await el.screenshot({ path: a[1] + '.png' }); }
  else await p.screenshot({ path: a[1] + '.png', fullPage: has('full') });
  if (errs.length) console.log(errs.join('\n'));
  console.log('ok', a[1]);
  await b.close();
})();
