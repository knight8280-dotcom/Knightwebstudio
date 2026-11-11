// How wide is each heading in Fraunces (as styled) against Georgia regular, and body text in Figtree against Arial?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/privacy/', '/terms/', '/checkout/', '/404.html'];
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const all = { h1: [], display: [], text: [], textBold: [] };
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;font-size:100px;letter-spacing:0;word-spacing:0;font-synthesis:none;visibility:hidden'; document.body.appendChild(probe);
      const w = (txt, fam, wt, fvs, synth) => { probe.style.fontFamily = fam; probe.style.fontWeight = wt; probe.style.fontVariationSettings = fvs; probe.style.fontSynthesis = synth || 'none'; probe.textContent = txt; return probe.getBoundingClientRect().width; };
      const out = { h1: [], display: [], text: [], textBold: [] };
      const seen = new Set();
      document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a.btn, .lede').forEach(el => {
        const txt = el.textContent.trim().replace(/\s+/g, ' '); if (txt.length < 12 || seen.has(txt)) return; seen.add(txt);
        const cs = getComputedStyle(el); const fam = cs.fontFamily; const wt = cs.fontWeight; const fvs = cs.fontVariationSettings; const tt = cs.textTransform;
        const t = tt === 'uppercase' ? txt.toUpperCase() : txt;
        if (/^"?Fraunces/.test(fam)) { const a = w(t, 'Fraunces', wt, fvs), b = w(t, 'Georgia', '400', 'normal'); (el.tagName === 'H1' ? out.h1 : out.display).push([a / b, wt, t.slice(0, 40)]); }
        else if (/^"?Figtree/.test(fam)) { const a = w(t, 'Figtree', wt, fvs), b = w(t, 'Arial', '400', 'normal'), bb = w(t, 'Arial', wt, 'normal', 'weight'); (parseInt(wt) >= 600 ? out.textBold : out.text).push([a / b, wt, t.slice(0, 40), a / bb]); }
      });
      probe.remove(); return out;
    });
    for (const k in r) all[k].push(...r[k]);
    await page.close();
  }
  const stat = (arr, i = 0) => { const v = arr.map(a => a[i]).sort((a, b) => a - b); const q = f => v[Math.floor((v.length - 1) * f)]; return `n=${v.length} min=${q(0).toFixed(3)} p10=${q(.1).toFixed(3)} median=${q(.5).toFixed(3)} p90=${q(.9).toFixed(3)} max=${q(1).toFixed(3)}`; };
  console.log('h1 (Fraunces as styled / Georgia regular):     ', stat(all.h1));
  console.log('other display text / Georgia regular:           ', stat(all.display));
  console.log('body text <600 (Figtree / Arial regular):       ', stat(all.text));
  console.log('bold body text >=600 (Figtree / Arial regular): ', stat(all.textBold), ' | vs Arial real bold face:', stat(all.textBold, 3));
  const byW = {}; for (const a of [...all.h1, ...all.display]) (byW[a[1]] = byW[a[1]] || []).push(a); for (const k in byW) console.log('  display weight', k, stat(byW[k]));
  const byT = {}; for (const a of [...all.text, ...all.textBold]) (byT[a[1]] = byT[a[1]] || []).push(a); for (const k in byT) console.log('  text weight', k, stat(byT[k]));
  console.log(all.h1.map(a => a[0].toFixed(3) + ' ' + a[2]).join('\n'));
  await browser.close();
})();
