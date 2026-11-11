const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const name = n => (n.name && n.name.value) || ''; const role = n => (n.role && n.role.value) || '';
  const prop = (n, k) => { const q = (n.properties || []).find(x => x.name === k); return q ? q.value.value : undefined; };
  const print = (n, d) => { if (!n.ignored) console.log(' '.repeat(d * 2) + role(n) + (name(n) ? ` "${name(n).slice(0, 70)}"` : '') + (prop(n, 'expanded') !== undefined ? ` expanded=${prop(n, 'expanded')}` : '') + (prop(n, 'level') ? ` level=${prop(n, 'level')}` : '')); for (const c of n.childIds || []) { const ch = byId.get(c); if (ch) print(ch, n.ignored ? d : d + 1); } };
  // find the Details groups and the figure
  const targets = nodes.filter(n => !n.ignored && (role(n) === 'Details' || role(n) === 'DisclosureTriangle' && false || role(n) === 'figure'));
  for (const t of targets.slice(0, 3).concat(targets.filter(n => role(n) === 'figure'))) { print(t, 0); console.log('---'); }
  const heads = nodes.filter(n => !n.ignored && role(n) === 'heading').map(n => `h${prop(n, 'level')} ${name(n)}`);
  console.log('headings exposed by Chromium:', heads.length, '\n  ' + heads.join('\n  '));
  await b.close();
})();
