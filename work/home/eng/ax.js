const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const lines = [];
  const walk = (n, d) => { if (!n) return; const role = n.role && n.role.value; const name = n.name && n.name.value; const ign = n.ignored;
    if (!ign && role && !['generic', 'none', 'InlineTextBox', 'StaticText', 'LineBreak'].includes(role)) lines.push('  '.repeat(Math.min(d, 12)) + role + (name ? ` "${name.slice(0, 110)}"` : ''));
    else if (!ign && role === 'StaticText') lines.push('  '.repeat(Math.min(d, 12)) + `text "${(name || '').slice(0, 90)}"`);
    for (const c of n.childIds || []) walk(byId.get(c), d + (ign || ['generic', 'none'].includes(role) ? 0 : 1)); };
  walk(nodes[0], 0);
  const txt = lines.join('\n'); const a = txt.indexOf('main'); console.log(txt.slice(a, a + 30000));
  await b.close();
})();
