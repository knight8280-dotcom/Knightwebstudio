const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [820, 1100], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map(n => [n.nodeId, n]));
    const role = n => n.role && n.role.value, nm = n => (n.name && n.name.value || '').replace(/\s+/g, ' ').slice(0, 90);
    console.log(`\n===== ${w}px =====`);
    // headings + landmarks
    const hs = nodes.filter(n => !n.ignored && role(n) === 'heading').map(n => `h${(n.properties || []).find(x => x.name === 'level').value.value} ${nm(n)}`);
    if (w === 390) console.log('HEADINGS\n  ' + hs.join('\n  '));
    const lm = nodes.filter(n => !n.ignored && ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'region', 'form', 'search'].includes(role(n))).map(n => `${role(n)} "${nm(n)}"`);
    if (w === 390) console.log('LANDMARKS ' + lm.join(' | '));
    // tables
    const tables = nodes.filter(n => !n.ignored && ['table', 'grid'].includes(role(n)));
    console.log('tables:', tables.map(t => `${role(t)} "${nm(t)}"`).join(' | '));
    const walk = (n, d, lines, max) => { if (!n) return; if (!n.ignored && role(n) && !['generic', 'none', 'StaticText', 'InlineTextBox', 'LayoutTable', 'LayoutTableRow', 'LayoutTableCell'].includes(role(n))) { lines.push('  '.repeat(d) + role(n) + (nm(n) ? ` "${nm(n)}"` : '')); d++; }
      else if (!n.ignored && /^Layout/.test(role(n) || '')) { lines.push('  '.repeat(d) + '!!' + role(n)); d++; }
      for (const c of n.childIds || []) walk(byId.get(c), d, lines, max); };
    for (const t of tables) { const lines = []; walk(t, 0, lines); const rows = lines.filter(l => /^\s*row/.test(l)).length, cells = lines.filter(l => /^\s*(cell|gridcell)/.test(l)).length, ch = lines.filter(l => /columnheader/.test(l)).length, rh = lines.filter(l => /rowheader/.test(l)).length;
      console.log(`-- ${nm(t)}: rows=${rows} columnheaders=${ch} rowheaders=${rh} cells=${cells}`); console.log(lines.slice(0, w === 390 ? 34 : 14).join('\n')); }
    const layout = nodes.filter(n => /^Layout/.test(role(n) || '')); console.log('LayoutTable nodes (semantics lost):', layout.length);
    // figure/img
    console.log('img roles:', nodes.filter(n => !n.ignored && ['img', 'image', 'figure'].includes(role(n))).map(n => `${role(n)} "${nm(n)}"`).join(' | '));
    // links with identical names but different targets
    const links = await p.evaluate(() => [...document.querySelectorAll('main a')].map(a => ({ n: (a.getAttribute('aria-label') || a.textContent).trim().replace(/\s+/g, ' '), h: a.getAttribute('href') })));
    const g = {}; for (const l of links) (g[l.n] = g[l.n] || new Set()).add(l.h);
    if (w === 390) console.log('same name, different destination:', Object.entries(g).filter(([k, v]) => v.size > 1).map(([k, v]) => `${k} -> ${[...v].join(', ')}`));
    await ctx.close();
  }
  await b.close();
})();
