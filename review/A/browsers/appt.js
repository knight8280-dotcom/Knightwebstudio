const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const eng of ['firefox', 'webkit']) { const b = await pw[eng].launch(); const out = [];
    for (const w of [980, 1040, 1100, 1200, 1280, 1366, 1440, 1536, 1680, 1920]) { const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
      out.push(w + ':' + await p.evaluate(() => { const t = document.querySelector('.appt-title'); const cs = getComputedStyle(t); const lines = Math.round((t.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight)); return lines + ' line' + (lines > 1 ? 's' : '') + ' (card ' + Math.round(document.querySelector('.appt').getBoundingClientRect().width) + 'px)'; })); await ctx.close(); }
    console.log(eng, out.join('  ')); await b.close(); }
})();
