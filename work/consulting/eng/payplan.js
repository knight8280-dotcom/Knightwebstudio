const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const w of [360, 390, 600, 760, 820, 980, 1024, 1100, 1280, 1440, 1920]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const bar = document.querySelector('#bundle .payplan-bar'); const segs = [...bar.children].map(s => { const r = s.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), s.scrollWidth > s.clientWidth + 1 ? 'TEXT-OVERFLOW' : '']; }); const br = bar.getBoundingClientRect(); const dep = segs[0][2], months = segs.slice(1).reduce((a, s) => a + s[2], 0); const panel = document.querySelector('#bundle').getBoundingClientRect(); const rc = document.querySelector('#bundle .receipt'); const rr = rc.getBoundingClientRect(); const cs = getComputedStyle(document.querySelector('#bundle')); const pad = parseFloat(cs.paddingLeft);
      return { barW: Math.round(br.width), segs: segs.map(s => s.join(',')), depShare: +(dep / (dep + months)).toFixed(3), sameRow: segs.every(s => s[1] === segs[0][1]), receiptW: Math.round(rc.offsetWidth), receiptBoxInsidePanel: { left: Math.round(rr.left - panel.left), right: Math.round(panel.right - rr.right), top: Math.round(rr.top - panel.top), bottom: Math.round(panel.bottom - rr.bottom) }, pad: Math.round(pad), cols: cs.gridTemplateColumns }; });
    console.log(w, JSON.stringify(r)); }
  await b.close();
})();
