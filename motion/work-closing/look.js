// node look.js <out.png> <url-path> <width> <height> <theme> <selector|end|y:NNN|full> [nojs] [still] [engine]
// Screenshot one element (clipped to the viewport height x 3), or the viewport at the page end / a scroll position.
const [out, path, w, h, theme, what, ...flags] = process.argv.slice(2);
if (flags.some(f => ['webkit', 'firefox'].includes(f))) process.env.PLAYWRIGHT_BROWSERS_PATH = __dirname + '/../.browsers-flat';
const pw = require('playwright');
(async () => {
  const eng = flags.find(f => ['webkit', 'firefox'].includes(f)) || 'chromium';
  const b = await pw[eng].launch(eng === 'chromium' ? { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] } : {});
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: flags.includes('2x') ? 2 : 1, javaScriptEnabled: !flags.includes('nojs'), reducedMotion: flags.includes('reduce') ? 'reduce' : 'no-preference', hasTouch: flags.includes('touch') });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', String(e)));
  p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('http://localhost:8730' + path, { waitUntil: 'networkidle' });
  if (flags.includes('nojs')) await p.addStyleTag({ content: `:root{color-scheme:${theme}}` }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  if (flags.includes('nohead')) await p.addStyleTag({ content: '.topbar,.site-header,.demo-bar,#mobile-cta{display:none!important}' });
  if (flags.includes('still')) await p.evaluate(() => document.querySelectorAll('.kws-shader').forEach(e => e.remove()));
  if (what === 'end') { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(900); await p.screenshot({ path: out }); }
  else if (what.startsWith('y:')) { await p.evaluate(y => scrollTo(0, y), +what.slice(2)); await p.waitForTimeout(900); await p.screenshot({ path: out }); }
  else if (what === 'full') { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); await p.screenshot({ path: out, fullPage: true }); }
  else {
    const el = p.locator(what).first();
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
    const box = await el.boundingBox();
    console.log(what, 'box', JSON.stringify(box && { w: Math.round(box.width), h: Math.round(box.height) }));
    await el.screenshot({ path: out });
  }
  await b.close();
})();
