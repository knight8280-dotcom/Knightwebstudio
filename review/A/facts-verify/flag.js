// Independent reproduction of F1: what text does each flagged note yield through
// textContent, innerText, a user selection (copy), and the accessibility tree?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [vp, w, h] of [['phone', 390, 844], ['desktop', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === 'localhost' ? r.continue() : r.abort(); });
    for (const p of ['/', '/consulting/']) {
      await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      const rows = await page.evaluate(() => {
        const out = [];
        for (const f of document.querySelectorAll('.flag')) {
          const par = f.parentElement;
          const next = f.nextSibling;
          const cs = getComputedStyle(f), ps = getComputedStyle(par);
          // selection: from start of flag to 12 chars into what follows
          const sel = getSelection(); sel.removeAllRanges();
          const r = document.createRange(); r.selectNodeContents(par); sel.addRange(r);
          const copied = sel.toString().slice(0, 60);
          sel.removeAllRanges();
          const fr = f.getBoundingClientRect();
          // gap between the pill's right edge and first glyph of following text
          let gap = null, sameLine = null;
          if (next && next.nodeType === 3 && next.textContent.trim()) {
            const rr = document.createRange(); const off = next.textContent.search(/\S/);
            rr.setStart(next, off); rr.setEnd(next, off + 1);
            const g = rr.getBoundingClientRect(); gap = +(g.left - fr.right).toFixed(1); sameLine = Math.abs((g.top + g.bottom) / 2 - (fr.top + fr.bottom) / 2) < fr.height;
          }
          out.push({
            parent: par.tagName.toLowerCase() + '.' + par.className.replace(/\s+/g, '.'),
            parentDisplay: ps.display, flagDisplay: cs.display, marginRight: cs.marginRight,
            visible: fr.width > 0 && cs.visibility !== 'hidden',
            nextIs: next ? (next.nodeType === 3 ? 'text:' + JSON.stringify(next.textContent.slice(0, 12)) : 'el:' + next.nodeName + '.' + (next.className || '')) : null,
            textContent: par.textContent.replace(/\s+/g, ' ').trim().slice(0, 50),
            innerText: par.innerText.replace(/\n/g, '\\n').slice(0, 50),
            copied: copied.replace(/\n/g, '\\n'),
            gapPx: gap, sameLine,
          });
        }
        return out;
      });
      console.log(`\n== ${vp} ${p}`);
      for (const r of rows) console.log(JSON.stringify(r));
      if (vp === 'phone') {
        const snap = await page.locator('p.note').first().ariaSnapshot().catch(e => 'ERR ' + e.message);
        console.log('aria p.note[0]:', snap.slice(0, 200));
      }
    }
    await ctx.close();
  }
  await b.close();
})();
