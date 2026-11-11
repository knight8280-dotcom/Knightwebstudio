// node clip.js OUT.png WIDTH[xHEIGHT] SELECTOR [theme] [nojs] -> screenshot of one element (or "viewport" for the first screen)
const { chromium } = require('playwright');
(async () => {
  const [out, size, sel, theme = 'light', nojs] = process.argv.slice(2);
  const [w, h] = size.split('x').map(Number);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h || (w < 700 ? 844 : 800) }, isMobile: w < 700, hasTouch: w < 700, colorScheme: theme, javaScriptEnabled: nojs !== 'nojs', deviceScaleFactor: parseFloat(process.env.DSF || "1") });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(process.env.URL || 'http://localhost:8720/', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  if (sel === 'viewport') { await p.waitForTimeout(900); await p.screenshot({ path: out }); }
  else if (sel === 'full') {
    // scroll through so reveals fire, then full page
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(120); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
    await p.screenshot({ path: out, fullPage: true });
  } else {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(90); }
    const el = p.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1300);
    // hide sticky chrome so it does not cover the element
    await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}' });
    await p.waitForTimeout(100);
    await el.screenshot({ path: out });
  }
  await b.close();
  console.log(out);
})();
