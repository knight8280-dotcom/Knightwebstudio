// OB-03: lines of the appointment-card title per engine and width
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
(async () => {
  const b = await eng.launch(); console.log(process.env.ENGINE, b.version());
  for (const path of (process.env.PATHS || '/pricing/,/').split(',')) {
    const out = [];
    for (const w of [390, 820, 980, 1040, 1100, 1160, 1200, 1280, 1366, 1440, 1536, 1680, 1920]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
      const r = await p.evaluate(() => { const t = document.querySelector('.appt-title'); if (!t) return null; const cs = getComputedStyle(t); const lh = parseFloat(cs.lineHeight); const rng = document.createRange(); rng.selectNodeContents(t); const rects = [...rng.getClientRects()]; const tops = [...new Set(rects.map(x => Math.round(x.top)))]; const card = t.closest('.appt') || t.parentElement; const band = document.querySelector('.cta-band'); return { text: t.textContent.trim(), lines: tops.length, tw: +t.getBoundingClientRect().width.toFixed(2), th: +t.getBoundingClientRect().height.toFixed(1), sw: t.scrollWidth, card: +card.getBoundingClientRect().width.toFixed(2), band: Math.round(band.getBoundingClientRect().height), textW: +Math.max(...rects.map(x => x.width)).toFixed(2), font: cs.fontFamily.slice(0, 20) + ' ' + cs.fontSize }; });
      out.push(r ? `${w}:${r.lines}L(card ${r.card}, title ${r.tw}x${r.th}, band ${r.band})` : `${w}:none`);
      if (process.env.SHOT && w === +process.env.SHOT && r) { const el = await p.$('.cta-band'); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700); await el.screenshot({ path: `shots/appt_${process.env.ENGINE}_${w}.png` }); }
      await ctx.close();
    }
    console.log(' ', path); out.forEach(o => console.log('    ' + o));
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
