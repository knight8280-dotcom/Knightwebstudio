// node test/shot.js <name> [--browser chromium|webkit|firefox --url ... --w 1440 --h 900 --theme light --at '#included' --off -80 --js 1 --rm 0
//                           --script 'code' --wait 700 --dpr 1 --full 0 --clip sel --out dir]
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
// Firefox and WebKit live in the kit's own browser folder; Chromium is Playwright's default one
if (arg('browser', 'chromium') !== 'chromium') process.env.PLAYWRIGHT_BROWSERS_PATH = require('path').resolve(__dirname, '../../../.browsers-flat');
const pw = require('playwright');
(async () => {
  const name = process.argv[2], w = +arg('w', 1440), h = +arg('h', 900), theme = arg('theme', 'light'), kind = arg('browser', 'chromium');
  const b = await pw[kind].launch();
  const opts = { viewport: { width: w, height: h }, deviceScaleFactor: +arg('dpr', 1), javaScriptEnabled: arg('js', '1') === '1',
    reducedMotion: arg('rm', '0') === '1' ? 'reduce' : 'no-preference', hasTouch: w < 700 };
  if (kind !== 'firefox') opts.isMobile = w < 700;
  const ctx = await b.newContext(opts);
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, theme);
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(arg('url', 'http://localhost:8730/kit/depth/demo.html'), { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const at = arg('at', '');
  if (at) await p.evaluate(([s, o]) => { const e = document.querySelector(s); document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [at, +arg('off', 0)]);
  await p.waitForTimeout(+arg('settle', 900));
  const script = arg('script', ''); if (script) { await p.evaluate(script); await p.waitForTimeout(+arg('wait', 700)); }
  const out = arg('out', __dirname + '/../shots') + '/' + name + '.png';
  const clip = arg('clip', '');
  if (clip) await p.locator(clip).first().screenshot({ path: out }); else await p.screenshot({ path: out, fullPage: arg('full', '0') === '1' });
  if (errs.length) console.log('ERRORS', errs);
  console.log(out);
  await b.close();
})();
