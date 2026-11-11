// Applies the proposed fix (block fieldsets; calculator fields in a wrapper that carries the grid) by rewriting the HTML and CSS on the way in,
// then reports legend and field geometry. Compare with/without FIX in each engine.
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const engine = process.env.ENGINE || 'webkit'; const withFix = !!process.env.FIX;
const CSSFIX_OLD = `
[data-page="contact"] fieldset.field{display:block}
@media (min-width:600px){
  [data-page="consulting"] .calc-group{display:block}
  [data-page="consulting"] .calc-pair{--pair:11rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--pair),1fr));gap:var(--s-4) var(--gap)}
}`;
const CSSFIX = `
[data-page="contact"] fieldset.field{display:block}
@media (min-width:600px){
  [data-page="consulting"] .calc-group{display:flex;flex-wrap:wrap}
  [data-page="consulting"] .calc-group .field{flex:1 1 var(--pair)}
}`;
(async () => {
  const b = await pw[engine].launch();
  for (const [W, path] of [[390, '/contact/'], [1280, '/contact/'], [390, '/consulting/'], [820, '/consulting/'], [1040, '/consulting/'], [1280, '/consulting/']]) {
    const runs = [];
    for (let i = 0; i < (+process.env.RUNS || 2); i++) {
      const o = { viewport: { width: W, height: 844 }, hasTouch: W < 900 }; if (W < 500 && engine !== 'firefox') o.isMobile = true;
      const ctx = await b.newContext(o);
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      if (withFix) {
        await ctx.route(/\/assets\/css\/styles\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8') + CSSFIX }));
        if (false) await ctx.route(/x/, r => { let h = fs.readFileSync('/home/user/Knightwebstudio/consulting/index.html', 'utf8');
          h = h.replace(/(<fieldset class="calc-group">\s*<legend class="label">[^<]*<\/legend>)([\s\S]*?)(<\/fieldset>)/g, '$1<div class="calc-pair">$2</div>$3'); r.fulfill({ status: 200, contentType: 'text/html', body: h }); });
      }
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
      runs.push(await p.evaluate(() => { const R = e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top + scrollY); };
        return [...document.querySelectorAll('fieldset')].map(f => 'fs ' + R(f) + ' lg ' + R(f.querySelector('legend')) + ' kids ' + [...f.querySelectorAll('.field, .chips')].map(R).join(' ')).join('\n      ') + '\n      page ' + document.documentElement.scrollHeight; }));
      if (process.env.SHOT && i === 0) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'start' }); scrollBy(0, -120); }); await p.waitForTimeout(300); await p.screenshot({ path: `${process.env.SHOT}_${W}_${path.replace(/\//g, '')}.png` }); }
      await ctx.close();
    }
    console.log(`${engine} ${withFix ? 'FIX' : 'now'} ${W} ${path}${new Set(runs).size > 1 ? '  (RUNS DIFFER)' : ''}\n      ` + [...new Set(runs)].join('\n   --\n      '));
  }
  await b.close();
})();
