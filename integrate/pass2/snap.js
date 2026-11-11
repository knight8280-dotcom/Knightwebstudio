// node snap.js OUT.png URL WIDTH HEIGHT [selector|y0,y1] [theme] [css] [dpr]
// One screenshot: the viewport, an element, or a vertical slice of the full page. Lazy pictures are loaded first.
const { chromium } = require('playwright');
const [out, url, w, h, what, theme, css, dpr] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(dpr || 1), colorScheme: theme || 'light', reducedMotion: 'reduce', isMobile: +w < 700, hasTouch: +w < 700 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme || 'light');
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  if (css) await p.addStyleTag({ content: css });
  await p.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await p.waitForTimeout(400);
  if (what && /^\d+,\d+$/.test(what)) {
    const [y0, y1] = what.split(',').map(Number);
    await p.screenshot({ path: out, fullPage: true, clip: { x: 0, y: y0, width: +w, height: y1 - y0 } });
  } else if (what && what !== '-') {
    const el = p.locator(what).first();
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(250);
    await el.screenshot({ path: out });
  } else await p.screenshot({ path: out });
  await b.close();
})();
