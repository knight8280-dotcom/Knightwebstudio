// Sweep widths: does any variant ever split "$Y/mo" at the slash, and how does the longest (Commerce) line break near 1100?
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await pw[engine].launch();
  const widths = []; for (let w = 360; w <= 430; w += 5) widths.push(w); for (let w = 760; w < 1100; w += 10) widths.push(w); for (let w = 1100; w <= 1300; w += 5) widths.push(w); for (let w = 1320; w <= 1920; w += 40) widths.push(w);
  const V = { plain: a => a + '/mo', amount: a => `<span class="nowrap">${a}/mo</span>`, unit: a => `${a}<span class="nowrap">/mo</span>` };
  const slash = { plain: [], amount: [], unit: [] }, three = { plain: [], amount: [], unit: [] }, odd = { plain: [], amount: [], unit: [] };
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  for (const w of widths) {
    await p.setViewportSize({ width: w, height: 900 });
    for (const v of Object.keys(V)) {
      const r = await p.evaluate(([v, fn]) => {
        const make = eval(fn); const out = [];
        for (const s of document.querySelectorAll('.spec-price small')) {
          const m = s.textContent.replace('⁠', '').match(/^(.*about )(\$[\d,]+)\/mo( for 3 months)$/);
          s.innerHTML = m[1] + make(m[2]) + m[3];
          const range = document.createRange(); const tops = []; const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); let n; const words = [];
          while ((n = walker.nextNode())) for (const mm of n.textContent.matchAll(/[^\s\/]+\/?|\//g)) { range.setStart(n, mm.index); range.setEnd(n, mm.index + mm[0].length); words.push([mm[0], Math.round(range.getClientRects()[0].top)]); }
          let lines = [], cur = [], last = null; for (const [t, y] of words) { if (last !== null && Math.abs(y - last) > 4) { lines.push(cur.join(' ')); cur = []; } cur.push(t); last = y; } lines.push(cur.join(' '));
          out.push(lines);
        }
        return out;
      }, [v, V[v].toString()]);
      r.forEach((lines, i) => { if (lines.some(l => /\/$/.test(l))) slash[v].push(w + '#' + i); if (lines.length >= 3) { three[v].push(w + '#' + i); if (lines.some(l => l.split(' ').length <= 2 && lines.indexOf(l) > 0)) odd[v].push(w + '#' + i + ' ' + lines.join(' | ')); } });
    }
  }
  for (const v of Object.keys(V)) { console.log(engine, v, '| split at the slash:', slash[v].length ? slash[v].join(' ') : 'never', '| three lines at:', three[v].length ? three[v].length + ' cells' : 'never'); odd[v].slice(0, 6).forEach(o => console.log('      short inner or last line: ' + o)); }
  await b.close();
})();
