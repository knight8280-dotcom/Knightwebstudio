const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright'); const fs = require('fs'); const downlevel = require('./downlevel.js');
(async () => {
  const b = await pw.webkit.launch(); const out = [];
  for (const w of [980, 1000, 1040, 1099, 1100, 1280]) { const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (process.env.DOWNLEVEL) await ctx.route(/\/assets\/css\/styles\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: downlevel(fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'), process.env.DOWNLEVEL) }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    if (process.env.FIXWGHT) await p.evaluate(() => { const jobs = []; for (const el of document.querySelectorAll('body, body *')) { if (el.ownerSVGElement) continue; const cs = getComputedStyle(el); jobs.push([el, '"wght" ' + cs.fontWeight + (/SOFT.? 100/.test(cs.fontVariationSettings) ? ', "SOFT" 100' : '')]); } for (const [el, v] of jobs) el.style.setProperty('font-variation-settings', v, 'important'); });
    await p.waitForTimeout(200);
    out.push(w + ': ' + await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'), c = document.querySelector('.bizcard'); const lh = parseFloat(getComputedStyle(s).lineHeight); return 'card ' + Math.round(c.getBoundingClientRect().width) + 'px, tagline ' + Math.round(s.getBoundingClientRect().height / lh) + ' line(s), overflow ' + Math.max(0, Math.round(s.scrollWidth - s.clientWidth)); })); await ctx.close(); }
  console.log((process.env.LABEL || 'webkit') + '  ' + out.join('  |  ')); await b.close();
})();
