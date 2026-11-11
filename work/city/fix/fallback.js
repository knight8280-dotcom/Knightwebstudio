// Measures each town name in the real display face and in two stand-ins for the fallback faces
// (Gelasio = metric-compatible with Georgia; Noto Serif = Android), at the shared sheet's size-adjust.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/web-design-gonzales/'); await p.evaluate(() => document.fonts.ready);
  const g = fs.readFileSync(__dirname + '/fonts/gelasio.woff2').toString('base64');
  const n = fs.readFileSync(__dirname + '/fonts/notoserif.woff2').toString('base64');
  await p.addStyleTag({ content: `
    @font-face { font-family: "GeoProxy"; src: url(data:font/woff2;base64,${g}) format("woff2"); font-weight: 400 700; size-adjust: 101%; }
    @font-face { font-family: "NotoProxy"; src: url(data:font/woff2;base64,${n}) format("woff2"); font-weight: 100 900; size-adjust: 101%; }` });
  const r = await p.evaluate(async () => {
    await Promise.all([document.fonts.load('400 100px GeoProxy'), document.fonts.load('700 100px GeoProxy'), document.fonts.load('400 100px NotoProxy'), document.fonts.load('700 100px NotoProxy')]);
    const out = {};
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font-size:100px;letter-spacing:-.03em;font-synthesis:none';
    s.className = 'display';
    document.body.appendChild(s);
    const names = ['Baton Rouge', 'Denham Springs', 'Gonzales', 'Prairieville'];
    for (const t of names) {
      s.style.fontFamily = ''; s.style.fontWeight = ''; s.textContent = t; const real = s.getBoundingClientRect().width / 100;
      const row = { fraunces600: +real.toFixed(3) };
      for (const [fam, w] of [['GeoProxy', 400], ['GeoProxy', 700], ['NotoProxy', 400], ['NotoProxy', 700]]) {
        s.style.fontFamily = fam; s.style.fontWeight = w; row[fam + w] = +(s.getBoundingClientRect().width / 100).toFixed(3);
      }
      out[t] = row;
    }
    s.remove();
    return out;
  });
  console.table(r);
  await b.close();
})();
