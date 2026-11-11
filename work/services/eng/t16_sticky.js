const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1366, 650], [1280, 720], [1280, 800], [1440, 900], [1024, 768], [1100, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const f = document.querySelector('.fig-col'); const cs = getComputedStyle(f); const fr = f.getBoundingClientRect(); const top = parseFloat(cs.top); const bar = document.getElementById('mobile-cta'); const barH = getComputedStyle(bar).display === 'none' ? 0 : bar.getBoundingClientRect().height; const col2 = f.nextElementSibling.getBoundingClientRect().height; const lead = document.querySelector('#build .lead'); return { pos: cs.position, stickyTop: top, figH: Math.round(fr.height), room: innerHeight - top - barH, col2: Math.round(col2), leadH: Math.round(lead.getBoundingClientRect().height), rowsH: Math.round(lead.nextElementSibling.getBoundingClientRect().height) }; });
    console.log(w + 'x' + h, JSON.stringify(r), r.pos === 'sticky' && r.figH > r.room ? `<<< sticky figure is ${r.figH - r.room}px taller than the room under the header: its caption is cut off while it is pinned` : '');
    await ctx.close();
  }
  await b.close();
})();
