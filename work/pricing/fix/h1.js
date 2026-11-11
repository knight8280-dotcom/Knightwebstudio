// The headline at every phone and tablet width: how it breaks, and that the brush mark sits on the last line with nothing under it.
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await pw[engine].launch();
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const seen = {};
  for (let w = 360; w <= 1000; w += 10) {
    await p.setViewportSize({ width: w, height: 800 });
    const r = await p.evaluate(() => { const h = document.querySelector('h1'); const range = document.createRange(); const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n, last = null, lines = [], cur = []; while ((n = walker.nextNode())) for (const m of n.textContent.matchAll(/\S+/g)) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const y = Math.round(range.getClientRects()[0].top); if (last !== null && Math.abs(y - last) > 8) { lines.push(cur.join(' ')); cur = []; } cur.push(m[0]); last = y; } lines.push(cur.join(' ')); const mk = h.querySelector('.mark').getBoundingClientRect(), hr = h.getBoundingClientRect(); return { lines: lines.join(' / '), markOnLastLine: mk.bottom > hr.bottom - parseFloat(getComputedStyle(h).fontSize) * .5 }; });
    const key = r.lines + (r.markOnLastLine ? '' : '  !! MARK NOT ON LAST LINE');
    (seen[key] = seen[key] || []).push(w);
  }
  for (const [k, v] of Object.entries(seen)) console.log(engine, v[0] + '-' + v[v.length - 1] + 'px:', k);
  await b.close();
})();
