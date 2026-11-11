// Page-specific checks for /pricing/ after the fix pass. node checks.js [engine]
const pw = require('/opt/node-tools/node_modules/playwright');
const engine = process.argv[2] || 'chromium';
const URL = 'http://localhost:8720/pricing/';
const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
(async () => {
  const b = await pw[engine].launch();
  const open = async (w, h = 900) => { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); return p; };

  // 1. Two-up cards, 760 to 1099: every cell of a pair starts on the same line
  let bad = [];
  for (let w = 760; w < 1100; w += 10) {
    const p = await open(w);
    const r = await p.evaluate(() => { const rows = [...document.querySelectorAll('.spec tbody tr')]; let worst = 0; for (let i = 0; i < rows.length; i += 2) { const a = [...rows[i].children], c = [...rows[i + 1].children]; a.forEach((el, k) => { worst = Math.max(worst, Math.abs(el.getBoundingClientRect().top - c[k].getBoundingClientRect().top)); }); const ba = rows[i].querySelector('.btn-block').getBoundingClientRect(), bc = rows[i + 1].querySelector('.btn-block').getBoundingClientRect(); worst = Math.max(worst, Math.abs(ba.top - bc.top), Math.abs(ba.height - bc.height)); } return Math.round(worst); });
    if (r > 1) bad.push(w + ':' + r);
    await p.close();
  }
  console.log('1 pair alignment 760-1099:', bad.length ? 'OFF at ' + bad.join(' ') : 'aligned at every width');

  // 2. Table from 1100: buttons one line, equal height, on one line across; quiet links aligned
  bad = [];
  for (let w = 1100; w <= 1920; w += 20) {
    const p = await open(w);
    const r = await p.evaluate(() => { const bs = [...document.querySelectorAll('.spec .btn-block')].map(e => e.getBoundingClientRect()); const qs = [...document.querySelectorAll('.spec .btn-quiet')].map(e => e.getBoundingClientRect()); const sp = a => Math.round(Math.max(...a) - Math.min(...a)); return { h: Math.round(bs[0].height), dh: sp(bs.map(x => x.height)), dt: sp(bs.map(x => x.top)), qt: sp(qs.map(x => x.top)), qh: sp(qs.map(x => x.height)) }; });
    if (r.dh > 0 || r.dt > 0 || r.qt > 0 || r.qh > 0 || r.h > 54) bad.push(w + ':' + JSON.stringify(r));
    await p.close();
  }
  console.log('2 table buttons 1100-1920:', bad.length ? 'OFF at ' + bad.join(' ') : 'one line, equal, aligned');

  // 3. Text spacing (WCAG 1.4.12): no text leaves its cell, nothing clipped, no sideways scroll
  for (const w of [360, 390, 820, 1024, 1100, 1120, 1160, 1200, 1240, 1280, 1440]) {
    const p = await open(w);
    await p.addStyleTag({ content: SPACING });
    const r = await p.evaluate(() => {
      const out = []; const vw = document.documentElement.clientWidth;
      const main = document.querySelector('main');
      const range = document.createRange();
      for (const cell of document.querySelectorAll('.spec tbody tr > *, .table tbody tr > *, .pl-row, .toc a, .receipt li, .payplan-seg')) {
        const cr = cell.getBoundingClientRect(); if (!cr.width) continue;
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        let n; while ((n = walker.nextNode())) { if (!n.textContent.trim()) continue; const pe = n.parentElement; if (pe.closest('.sr-only') || getComputedStyle(pe).display === 'none' || pe.closest('.popular')) continue; range.selectNodeContents(n); for (const rc of range.getClientRects()) { const over = Math.round(Math.max(rc.right - cr.right, cr.left - rc.left)); if (over > 1) out.push((cell.className || cell.tagName) + ' "' + n.textContent.trim().slice(0, 18) + '" +' + over); } }
      }
      return { scroll: Math.max(0, main.scrollWidth - vw), over: [...new Set(out)].slice(0, 6) };
    });
    console.log('3 text spacing', w, r.scroll ? 'SIDEWAYS ' + r.scroll : 'no scroll', r.over.length ? 'OVER: ' + r.over.join(' | ') : 'text inside cells');
    await p.close();
  }

  // 4. Seal clear of the header, 980 to 1300
  bad = [];
  for (let w = 980; w <= 1440; w += 20) {
    const p = await open(w);
    const r = await p.evaluate(() => { const s = document.querySelector('.toc-seal svg, .toc-seal .seal').getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); const btns = [...document.querySelectorAll('.site-header .icon-btn, .site-header .header-cta')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()); return { gapHeader: Math.round(s.top - h.bottom), gapBtn: Math.round(s.top - Math.max(...btns.map(x => x.bottom))), right: Math.round(document.documentElement.clientWidth - s.right) }; });
    bad.push(w + ':' + r.gapHeader + '/' + r.gapBtn + '/' + r.right);
    await p.close();
  }
  console.log('4 seal top minus header bottom / minus lowest header button / room to the right edge:', bad.join(' '));

  // 5. Text-only enlargement on a phone
  for (const pct of [130, 150, 200]) {
    const p = await open(390, 844);
    await p.addStyleTag({ content: `html{font-size:${pct}%}` });
    const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth; const off = [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > vw + 1 && !e.closest('.sr-only'); }).map(e => (e.className || e.tagName) + ' +' + Math.round(e.getBoundingClientRect().right - vw)); const hits = [...document.querySelectorAll('.spec tbody tr')].map(tr => { const n = tr.querySelector('.spec-name'); const range = document.createRange(); range.selectNodeContents(n.firstChild); const nr = range.getBoundingClientRect(); range.selectNodeContents(tr.querySelector('.spec-price').firstChild); const pr = range.getBoundingClientRect(); return Math.round(nr.right - pr.left); }); return { scroll: document.documentElement.scrollWidth - vw, off: [...new Set(off)].slice(0, 5), nameIntoPrice: hits }; });
    console.log('5 text ' + pct + '%:', JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
