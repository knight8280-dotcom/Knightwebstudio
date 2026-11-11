// node end.js <url> <outprefix> [--w 390,1440] [--themes light,dark] [--sel 'body > footer'] [--noshader] [--reduce] [--nojs]
// Screenshots an element with the page scrolled to its very end (so scroll-linked states are final).
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const has = k => process.argv.includes('--' + k);
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const widths = arg('w', '390,1440').split(',').map(Number), themes = arg('themes', 'light,dark').split(',');
  const sel = arg('sel', 'body > footer'), dpr = +arg('dpr', 0);
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const w of widths) for (const theme of themes) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: dpr || (w < 700 ? 2 : 1), reducedMotion: has('reduce') ? 'reduce' : 'no-preference', javaScriptEnabled: !has('nojs'), colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    if (has('noshader')) await p.route('**/shader.js', r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '.demo-bar{position:static !important}' });
    const h = await p.evaluate(s => Math.ceil(document.querySelector(s).getBoundingClientRect().height), sel);
    const vh = Math.max(600, Math.min(h + (+arg('above', 0)), 3000));
    await p.setViewportSize({ width: w, height: vh });
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(+arg('wait', 1200));
    const want = Math.min(vh, h + (+arg('above', 0)));
    await p.screenshot({ path: out + '-' + w + '-' + theme + '.png', clip: { x: 0, y: vh - want, width: w, height: want } });
    await ctx.close();
  }
  await b.close();
})();
