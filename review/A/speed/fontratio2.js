// Same ratios against the Android fallbacks named in the stylesheet (Noto Serif, Roboto), loaded here as test web fonts.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/pricing/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/terms/', '/404.html'];
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  await ctx.route('**/__t/*.woff2', r => r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(__dirname + '/fonts/' + r.request().url().split('/').pop()) }));
  const all = { d: [], t: [] };
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
    const r = await page.evaluate(async () => {
      const a = new FontFace('TNotoSerif', 'url(/__t/notoserif-400.woff2)'), b = new FontFace('TRoboto', 'url(/__t/roboto-400.woff2)'); document.fonts.add(await a.load()); document.fonts.add(await b.load()); await document.fonts.ready;
      const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;font-size:100px;letter-spacing:0;font-synthesis:none;visibility:hidden'; document.body.appendChild(probe);
      const w = (txt, fam, wt, fvs) => { probe.style.fontFamily = fam; probe.style.fontWeight = wt; probe.style.fontVariationSettings = fvs; probe.textContent = txt; return probe.getBoundingClientRect().width; };
      const out = { d: [], t: [] }; const seen = new Set();
      document.querySelectorAll('main h1, main h2, main h3, main p, main li, .lede').forEach(el => { const txt = el.textContent.trim().replace(/\s+/g, ' '); if (txt.length < 12 || seen.has(txt)) return; seen.add(txt); const cs = getComputedStyle(el);
        if (/^"?Fraunces/.test(cs.fontFamily)) out.d.push(w(txt, 'Fraunces', cs.fontWeight, cs.fontVariationSettings) / w(txt, 'TNotoSerif', '400', 'normal'));
        else if (parseInt(cs.fontWeight) < 600 && cs.textTransform !== 'uppercase') out.t.push(w(txt, 'Figtree', cs.fontWeight, cs.fontVariationSettings) / w(txt, 'TRoboto', '400', 'normal')); });
      return out; });
    all.d.push(...r.d); all.t.push(...r.t); await page.close();
  }
  const stat = v => { v = v.slice().sort((a, b) => a - b); const q = f => v[Math.floor((v.length - 1) * f)]; return `n=${v.length} min=${q(0).toFixed(3)} p10=${q(.1).toFixed(3)} median=${q(.5).toFixed(3)} p90=${q(.9).toFixed(3)} max=${q(1).toFixed(3)}`; };
  console.log('display (Fraunces as styled / Noto Serif regular):', stat(all.d));
  console.log('body text (Figtree / Roboto regular):             ', stat(all.t));
  await browser.close();
})();
