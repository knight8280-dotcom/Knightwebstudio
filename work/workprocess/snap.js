// node snap.js URL WIDTH HEIGHT THEME OUT [--js "code"] [--css "css"] [--full] [--y N] [--nojs] [--sel SELECTOR]
const { chromium } = require('playwright');
(async () => {
  const [url, w, h, theme, out] = process.argv.slice(2);
  const opt = k => { const i = process.argv.indexOf('--' + k); return i > -1 ? (process.argv[i + 1] || true) : null; };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: theme, isMobile: +w < 500, hasTouch: +w < 500, javaScriptEnabled: !process.argv.includes('--nojs'), reducedMotion: process.argv.includes('--rm') ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(700);
  if (opt('css')) await p.addStyleTag({ content: opt('css') });
  if (opt('js')) await p.evaluate(opt('js'));
  if (process.argv.includes('--full')) { const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += 400) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(60); } await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(700); }
  if (opt('y')) { await p.evaluate(y => scrollTo(0, +y), opt('y')); await p.waitForTimeout(700); }
  if (opt('sel')) { const el = await p.$(opt('sel')); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700); await el.screenshot({ path: out }); }
  else await p.screenshot({ path: out, fullPage: process.argv.includes('--full') });
  console.log(out, await p.evaluate(() => document.documentElement.scrollHeight));
  await b.close();
})();
