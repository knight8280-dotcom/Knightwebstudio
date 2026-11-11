const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
(async () => {
  const b = await chromium.launch();
  for (const base of ['http://localhost:8720', 'http://localhost:8700']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto(base + path, { waitUntil: 'load' });
      await p.waitForTimeout(150);
      const t = await p.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true); document.querySelectorAll('[hidden]').forEach(e => e.hidden = false); return document.body.innerText; });
      const pats = [/\S+ [,.;:!?](?=\s|$)/g, /\.\.(?!\.)/g, /,,/g, /[a-z]\.[A-Z][a-z]/g, /\(\s|\s\)/g, /\b(\w+) \1\b/gi, /[“"][^”"\n]{0,80}$/gm, / {2,}/g, /\$ \d/g, /\d ,\d/g, /[a-z],[a-z]/gi, /\s['’]s\b/g, /—\S|\S—/g, /\ba (?=[aeiou])\w+/gi, /\ban (?=[bcdfgjklmnpqrstvwxyz])\w+/gi];
      const hits = [];
      for (const re of pats) { let m; while ((m = re.exec(t))) { const s = t.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25).replace(/\n/g, '⏎'); hits.push(re.source.slice(0, 14) + ' → ' + s); if (hits.length > 60) break; } }
      console.log((base.endsWith('8720') ? 'NEW ' : 'BASE ') + path + ' (' + hits.length + ')');
      for (const h of hits) console.log('     ' + h);
    }
    await ctx.close();
  }
  await b.close();
})();
