// clip.js: node clip.js OUT.png URL WIDTH THEME [SELECTOR [PAD_ABOVE [HEIGHT [nth]]]]  -> one clip of a full page (motion reduced, lazy images loaded)
const { chromium } = require('playwright');
const [out, url, width, theme, sel, padA, hgt, nth] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const w = +width;
  const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', isMobile: w < 700, hasTouch: w < 700 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { for (const im of document.images) { im.loading = 'eager'; } await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))); });
  await p.waitForTimeout(400);
  let clip = null;
  if (sel) { const box = await p.evaluate(([s, n]) => { const els = document.querySelectorAll(s); const e = els[n]; if (!e) return null; const r = e.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; }, [sel, +(nth || 0)]);
    if (!box) { console.log('no element', sel); await b.close(); return; }
    const full = await p.evaluate(() => document.documentElement.scrollHeight);
    const y = Math.max(0, Math.round(box.y - +(padA || 0))); const h = Math.min(+(hgt || 0) || Math.round(box.h + 2 * +(padA || 0)), full - y);
    clip = { x: 0, y, width: w, height: h }; }
  await p.screenshot({ path: out, fullPage: true, ...(clip ? { clip } : {}) }); console.log(out, clip || 'full');
  await b.close();
})();
