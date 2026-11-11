// node snap.js OUT WIDTHxHEIGHT[,WxH...] [--y N | --sel CSS] [--dark] [--full] [--nojs]
// viewport screenshots at given sizes; --sel scrolls that element to the top (minus header), --full = full page
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const a = process.argv.slice(2);
  const out = a[0]; const sizes = a[1].split(',').map(s => s.split('x').map(Number));
  const opt = k => { const i = a.indexOf('--' + k); return i > -1 ? (a[i + 1] || true) : null; };
  const dark = a.includes('--dark'), full = a.includes('--full'), nojs = a.includes('--nojs');
  const url = opt('url') || 'http://localhost:8720/';
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, colorScheme: dark ? 'dark' : 'light', javaScriptEnabled: !nojs, reducedMotion: a.includes('--rm') ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, dark ? 'dark' : 'light');
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForTimeout(700);
    if (opt('sel')) {
      await p.evaluate(([s, off]) => { const e = document.querySelector(s); const y = e.getBoundingClientRect().top + scrollY - off; scrollTo({ top: y, behavior: 'instant' }); }, [opt('sel'), parseInt(opt('off') || '80', 10)]);
    } else if (opt('y')) await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), parseInt(opt('y'), 10));
    if (full) { // make every reveal visible for a full-page shot
      await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 110)); } scrollTo({ top: 0, behavior: 'instant' }); });
    }
    await p.waitForTimeout(parseInt(opt('wait') || '900', 10));
    const f = path.join(out, `${opt('name') || 'snap'}-${w}${dark ? '-dark' : ''}.png`);
    await p.screenshot({ path: f, fullPage: full });
    console.log(f);
    await ctx.close();
  }
  await b.close();
})();
