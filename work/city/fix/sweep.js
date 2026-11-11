// Line breaks in headings and short lines at each width: split place names, one-word last lines, line counts.
const { chromium } = require('playwright');
const SEL = 'main h2, main h3, main summary, .tier-plan, .board-extras div, .board .btn, .cta-copy .fine, .board-head p, .eyebrow, .city-meet .pills';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ reducedMotion: 'reduce' })).newPage();
  const widths = [360, 375, 390, 412, 430, 600, 760, 820, 980, 1024, 1100, 1180, 1280, 1440, 1920];
  for (const town of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    const split = [], orphan = {}, tall = {};
    for (const w of widths) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.goto(`http://localhost:8720/web-design-${town}/`); await p.evaluate(() => document.fonts.ready);
      const rows = await p.evaluate((SEL) => {
        const out = [];
        for (const el of document.querySelectorAll(SEL)) {
          if (!el.getClientRects().length || el.matches('.pills')) continue;
          const words = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
          while (n = tw.nextNode()) { const re = /\S+/g; let m; while (m = re.exec(n.nodeValue)) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rc = r.getClientRects()[0]; if (rc) words.push([m[0], Math.round(rc.top + rc.height / 2)]); } }
          const lines = []; let last = null;
          for (const [t, y] of words) { if (last === null || Math.abs(y - last) > 6) lines.push([]); lines[lines.length - 1].push(t); last = y; }
          out.push({ tag: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), lines: lines.map(l => l.join(' ')) });
        }
        return out;
      }, SEL);
      for (const r of rows) {
        const txt = r.lines.join(' / ');
        if (/Baton \/ Rouge|Denham \/ Springs|home- \/ service/.test(txt) || /Baton ?$/.test(r.lines[0])) split.push(`${w}: ${txt}`);
        if (r.lines.length > 1 && r.lines[r.lines.length - 1].split(' ').length === 1) (orphan[txt] = orphan[txt] || []).push(w);
        if (/^h2/.test(r.tag) && r.lines.length >= 4) (tall[txt] = tall[txt] || []).push(w);
      }
    }
    console.log(`\n== ${town}`);
    console.log('  split names:', split.length ? '\n    ' + split.join('\n    ') : 'none');
    console.log('  one-word last lines:'); for (const [t, ws] of Object.entries(orphan)) console.log(`    [${ws.join(',')}] ${t}`);
    console.log('  h2 in four or more lines:', Object.keys(tall).length ? JSON.stringify(tall) : 'none');
  }
  await b.close();
})();
