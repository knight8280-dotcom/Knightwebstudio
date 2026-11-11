// node shot.js <url> <outprefix> [--sel css] [--w 390,1440] [--themes light,dark] [--full] [--reduce] [--nojs] [--wait ms]
// Screenshots a page, or every element matching --sel, at each width and theme.
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const has = k => process.argv.includes('--' + k);
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const widths = arg('w', '390,1440').split(',').map(Number), themes = arg('themes', 'light,dark').split(',');
  const sel = arg('sel'), wait = +arg('wait', 900);
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const w of widths) for (const theme of themes) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: w < 700 ? 2 : 1, reducedMotion: has('reduce') ? 'reduce' : 'no-preference', javaScriptEnabled: !has('nojs') });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    if (has('noshader')) await p.route('**/shader.js', r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '.demo-bar{position:static !important}' });
    if (has('nojs')) await p.emulateMedia({ colorScheme: theme });
    if (sel) {
      const els = await p.$$(sel);
      let i = 0;
      for (const el of els) {
        await el.scrollIntoViewIfNeeded();
        await p.waitForTimeout(wait);
        const name = out + '-' + w + '-' + theme + (els.length > 1 ? '-' + (++i) : '') + '.png';
        await el.screenshot({ path: name });
      }
    } else {
      await p.waitForTimeout(wait);
      await p.screenshot({ path: out + '-' + w + '-' + theme + '.png', fullPage: has('full') });
    }
    if (errs.length) console.log(w, theme, 'ERRORS', errs);
    await ctx.close();
  }
  await b.close();
})();
