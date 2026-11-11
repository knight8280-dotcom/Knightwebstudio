// Dump the accessibility tree (CDP) per page at 390 and 1280; write compact outline files and a summary.
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const summary = {};
  for (const w of [390, 1280]) for (const path of PAGES) {
    const ctx = await ctxFor(b, { w, h: w === 390 ? 844 : 800, reduced: true, mobile: w === 390 });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map(n => [n.nodeId, n]));
    const lines = [];
    const prop = (n, k) => { const x = (n.properties || []).find(q => q.name === k); return x ? x.value.value : undefined; };
    const walk = (n, d) => {
      const role = n.role ? n.role.value : '';
      const name = n.name ? n.name.value : '';
      let nd = d;
      if (!n.ignored && !['generic', 'none', 'InlineTextBox', 'StaticText', 'LineBreak', 'paragraph', 'RootWebArea', 'emphasis', 'strong', 'LayoutTableCell', 'LayoutTableRow', 'LayoutTable', 'ListMarker', 'DescriptionListTerm_', 'mark', 'time', 'deletion', 'insertion', 'subscript', 'superscript', 'sectionheader', 'sectionfooter'].includes(role)) {
        const extras = ['level', 'expanded', 'checked', 'required', 'invalid', 'disabled', 'focusable', 'hidden', 'url'].map(k => { const v = prop(n, k); return v === undefined || k === 'focusable' || k === 'url' ? '' : `${k}=${v}`; }).filter(Boolean).join(' ');
        const desc = n.description && n.description.value ? ` desc="${n.description.value}"` : '';
        lines.push('  '.repeat(d) + role + (name ? ` "${name.replace(/\s+/g, ' ').slice(0, 140)}"` : '') + (extras ? ' [' + extras + ']' : '') + desc);
        nd = d + 1;
      } else if (!n.ignored && role === 'StaticText') {
        lines.push('  '.repeat(d) + 'text "' + name.replace(/\s+/g, ' ').slice(0, 140) + '"');
      } else if (!n.ignored && ['paragraph', 'LayoutTable', 'LayoutTableRow', 'LayoutTableCell', 'deletion', 'insertion', 'mark', 'time'].includes(role)) {
        lines.push('  '.repeat(d) + '(' + role + ')'); nd = d + 1;
      }
      for (const c of n.childIds || []) { const cn = byId.get(c); if (cn) walk(cn, nd); }
    };
    walk(nodes[0], 0);
    fs.writeFileSync(`out/tree_${slug(path)}_${w}.txt`, lines.join('\n'));
    // summary
    const live = nodes.filter(n => !n.ignored);
    const roleOf = n => n.role ? n.role.value : '';
    const heads = live.filter(n => roleOf(n) === 'heading').map(n => ({ level: prop(n, 'level'), name: n.name.value }));
    const land = live.filter(n => ['banner', 'main', 'navigation', 'contentinfo', 'complementary', 'region', 'search', 'form'].includes(roleOf(n))).map(n => roleOf(n) + (n.name && n.name.value ? `:"${n.name.value}"` : ''));
    const tables = live.filter(n => ['table', 'grid'].includes(roleOf(n))).map(n => {
      const kids = []; const collect = (x) => { for (const c of x.childIds || []) { const cn = byId.get(c); if (!cn) continue; kids.push(cn); collect(cn); } }; collect(n);
      const k = kids.filter(x => !x.ignored); const cnt = r => k.filter(x => roleOf(x) === r).length;
      return { name: n.name ? n.name.value : '', rows: cnt('row'), colheaders: cnt('columnheader'), rowheaders: cnt('rowheader'), cells: cnt('cell') + cnt('gridcell'), colheaderNames: k.filter(x => roleOf(x) === 'columnheader').map(x => x.name.value) };
    });
    summary[`${path} @${w}`] = { h1: heads.filter(h => h.level === 1).length, heads, land, tables, lists: live.filter(n => roleOf(n) === 'list').length, listitems: live.filter(n => roleOf(n) === 'listitem').length, imgs: live.filter(n => ['img', 'image'].includes(roleOf(n))).map(n => n.name ? n.name.value : '') };
    await ctx.close();
  }
  fs.writeFileSync('out/tree_summary.json', JSON.stringify(summary, null, 1));
  await b.close();
})();
