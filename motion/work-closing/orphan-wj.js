// Does the full stop after the marked words ever fall onto a line of its own? node orphan.js <engine>
const eng = process.argv[2];
if (eng !== 'chromium') process.env.PLAYWRIGHT_BROWSERS_PATH = __dirname + '/../.browsers-flat';
const pw = require('playwright');
(async () => {
  const b = await pw[eng].launch();
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const bad = [];
  for (const title of ['Still deciding? Book the <span class="kws-close-mark">free call</span>&#8288;.', 'Ready when you are: get <span class="kws-close-mark">your free estimate</span>&#8288;.', 'Book <span class="kws-close-mark">a free thirty-minute call</span>&#8288;, today.']) {
    await p.evaluate(t => { document.querySelector('#close-sign').innerHTML = t; }, title);
    for (let w = 320; w <= 620; w += 6) {
      await p.setViewportSize({ width: w, height: 800 });
      const r = await p.evaluate(() => { const h = document.querySelector('#close-sign'), m = h.querySelector('.kws-close-mark'), tail = m.nextSibling, rg = document.createRange(); rg.setStart(tail, 1); rg.setEnd(tail, 2);
        const dot = rg.getBoundingClientRect(), mr = m.getBoundingClientRect(); return { dotTop: Math.round(dot.top), markBottom: Math.round(mr.bottom), dotBottom: Math.round(dot.bottom), over: document.documentElement.scrollWidth - innerWidth }; });
      if (r.dotTop >= r.markBottom - 4 || r.over > 0) bad.push(`${w}px "${title.replace(/<[^>]+>/g, '').slice(0, 30)}" ${JSON.stringify(r)}`);
    }
  }
  console.log(eng, bad.length ? 'ORPHANED/OVERFLOW: ' + bad.slice(0, 8).join(' ; ') + ` (${bad.length} cases)` : 'never: the full stop always stays on the marked words\' last line, and nothing overflows (320 to 620px, three titles)');
  await b.close();
})();
