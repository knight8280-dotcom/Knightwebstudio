// VA-01: stamp vs scalloped edge of the closing band on /start/, business card vs band on /
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
const BASE = 'http://localhost:8720';
(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    for (const w of [360, 390, 430, 600, 760, 820, 980, 1280, 1440]) {
      const h = w < 600 ? 844 : 900;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme, isMobile: w < 600, hasTouch: w < 600 });
      await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      for (const p of ['/start/', '/']) {
        if (theme === 'dark' && w !== 390) continue;
        const page = await ctx.newPage();
        await page.goto(BASE + p, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        // scroll through the page so reveals fire
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += h * 0.8) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
        const r = await page.evaluate((p) => {
          const band = document.querySelector('.cta-band');
          const bandTop = band.getBoundingClientRect().top + scrollY;
          const before = getComputedStyle(band, '::before');
          const scH = parseFloat(before.height);
          const prev = band.previousElementSibling;
          const out = { bandTop: +bandTop.toFixed(1), scallopH: scH, scallopTipY: +(bandTop - scH).toFixed(1), prevSection: prev && (prev.id || prev.className), prevPadBottom: prev && getComputedStyle(prev).paddingBottom };
          let el;
          if (p === '/start/') el = document.querySelector('#process .stamp'); else el = document.querySelector('#about .bizcard') || document.querySelector('.bizcard');
          if (el) {
            const b = el.getBoundingClientRect();
            out.el = el.className; out.elBottom = +(b.bottom + scrollY).toFixed(1); out.elLeft = +b.left.toFixed(1); out.elRight = +b.right.toFixed(1);
            out.gapToScallopTip = +(bandTop - scH - (b.bottom + scrollY)).toFixed(1);
            out.gapToBandTop = +(bandTop - (b.bottom + scrollY)).toFixed(1);
            out.elInSection = prev && prev.contains(el);
            // the unrotated box too
            out.rotate = getComputedStyle(el).rotate;
          }
          return out;
        }, p);
        console.log(theme, w, p, JSON.stringify(r));
        if ([360, 390, 600, 820, 1280].includes(w)) {
          // screenshot the area around the band top
          const y = r.bandTop - 320;
          await page.evaluate(yy => window.scrollTo(0, yy), y);
          await page.waitForTimeout(700);
          await page.screenshot({ path: path.join(OUT, `va01_${p === '/' ? 'home' : 'start'}_${w}_${theme}.png`) });
        }
        await page.close();
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
