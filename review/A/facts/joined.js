// Words that butt together in the rendered text (innerText honours CSS display), plus double spaces and stray characters.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.waitForTimeout(200);
      const t = await p.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true); return document.body.innerText; });
      const hits = new Set();
      const re = /\S*(?:[a-z\]\.\)][A-Z][a-z]|[a-z]\$\d|\d[A-Z][a-z]|[a-z]\d{2,}|[,;:][A-Za-z]|[a-z]\.[A-Z])\S*/g;
      let m; while ((m = re.exec(t))) { const s = m[0]; if (/KnightWebstudio|JavaScript|hCaptcha|smilyssoftwash\.com|gmail\.com|risenhealthco|corbelbooks|IONOS|BPC|YouTube|McK|c-[a-z]|Web3Forms|9am|6pm/.test(s)) continue; hits.add(s); }
      const dbl = (t.match(/[^\s] {2,}[^\s]/g) || []).slice(0, 5);
      const odd = (t.match(/[�Ââ€]{1}[^\s]{0,6}|&[a-z]+;|&#\d+;|\{\{|\}\}|TODO|FIXME|lorem|ipsum|XXX|EDIT ME|PLACEHOLDER/gi) || []).slice(0, 8);
      console.log(w + ' ' + path + ' joined: ' + JSON.stringify([...hits]) + (dbl.length ? ' dbl:' + JSON.stringify(dbl) : '') + (odd.length ? ' odd:' + JSON.stringify(odd) : ''));
    }
    await ctx.close();
  }
  await b.close();
})();
