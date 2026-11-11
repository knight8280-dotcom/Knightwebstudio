const { chromium } = require('playwright'); const fs = require('fs');
const axeSrc = fs.readFileSync(__dirname + '/axe/node_modules/axe-core/axe.min.js', 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1440, 900]]) for (const open of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    if (open) await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    await p.evaluate(axeSrc);
    const r = await p.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }); return { v: res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 160)) })), inc: res.incomplete.map(v => ({ id: v.id, n: v.nodes.length, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')) })), passes: res.passes.length }; });
    console.log(`\n== axe ${theme} ${w} ${open ? 'all rows open' : 'default'}: ${r.v.length} violation type(s), ${r.passes} rules passed`);
    for (const v of r.v) console.log('  VIOLATION', v.id, `(${v.impact})`, v.help, 'x' + v.n, '\n     ' + v.nodes.join('\n     '));
    if (w === 1440 && theme === 'light' && open) console.log('  incomplete (needs a human):', JSON.stringify(r.inc));
    await ctx.close();
  }
  await b.close();
})();
